import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreditPlanService } from './credit-plan.service';
import { CreditPlan } from '../entities/credit-plan.entity';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { PaymentsService } from '../../payments/payments.service';
import { CreditService } from './credit.service';
import { BranchesService } from '../../branches/branches.service';
import { SettingsService } from '../../settings/settings.service';

describe('CreditPlanService', () => {
  let service: CreditPlanService;
  let creditPlanRepo: Repository<CreditPlan>;
  let paymentsService: PaymentsService;
  let creditService: CreditService;
  let branchesService: BranchesService;
  let settingsService: SettingsService;

  const mockCreditPlan = {
    id: 'plan-123',
    name: 'Standard Plan',
    price: 5000,
    smsAmount: 100,
    emailAmount: 200,
    whatsappAmount: 50,
    currency: 'NGN',
    isActive: true,
  };

  const mockWallet = {
    businessId: 'biz-123',
    smsCredits: 10,
    emailCredits: 20,
    whatsappCredits: 5,
  };

  const mockSettings = {
    creditPriceSms: 15.0,
    creditPriceWhatsapp: 25.0,
    creditPriceEmail: 2.0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditPlanService,
        {
          provide: getRepositoryToken(CreditPlan),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockCreditPlan),
            create: jest.fn().mockReturnValue(mockCreditPlan),
            save: jest.fn().mockResolvedValue(mockCreditPlan),
            find: jest.fn().mockResolvedValue([mockCreditPlan]),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            verifyTransaction: jest.fn(),
            recordPayment: jest.fn().mockResolvedValue({}),
            findByReference: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: CreditService,
          useValue: {
            addCredits: jest.fn().mockResolvedValue({}),
            getOrCreateWallet: jest.fn().mockResolvedValue(mockWallet),
          },
        },
        {
          provide: BranchesService,
          useValue: {
            findById: jest
              .fn()
              .mockResolvedValue({ id: 'branch-123', businessId: 'biz-123' }),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getGlobalSettings: jest.fn().mockResolvedValue(mockSettings),
          },
        },
      ],
    }).compile();

    service = module.get<CreditPlanService>(CreditPlanService);
    creditPlanRepo = module.get<Repository<CreditPlan>>(
      getRepositoryToken(CreditPlan),
    );
    paymentsService = module.get<PaymentsService>(PaymentsService);
    creditService = module.get<CreditService>(CreditService);
    branchesService = module.get<BranchesService>(BranchesService);
    settingsService = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchase', () => {
    it('should successfully award credits on valid payment', async () => {
      const reference = 'ref-123';
      const branchId = 'branch-123';

      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue({
        status: 'success',
        amount: 500000, // 5000 * 100
      });

      const result = await service.purchase(branchId, 'plan-123', reference);

      expect(creditService.addCredits).toHaveBeenCalledTimes(3);
      expect(paymentsService.recordPayment).toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });

    it('should throw BadRequestException if payment verification fails', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(null);

      await expect(
        service.purchase('branch-123', 'plan-123', 'ref-fail'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if paid amount is insufficient', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue({
        amount: 400000, // 4000 instead of 5000
      });

      await expect(
        service.purchase('branch-123', 'plan-123', 'ref-low'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      jest.spyOn(creditPlanRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.purchase('branch-123', 'invalid-plan', 'ref'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should short-circuit and return wallet if payment reference has already been processed (idempotency)', async () => {
      jest
        .spyOn(paymentsService, 'findByReference')
        .mockResolvedValueOnce({ id: 'pmt-123' } as any);

      const result = await service.purchase(
        'branch-123',
        'plan-123',
        'ref-processed',
      );

      expect(creditService.addCredits).not.toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });
  });

  describe('purchaseCustom', () => {
    it('should successfully award custom credits on valid payment', async () => {
      const reference = 'ref-custom-123';
      const branchId = 'branch-123';

      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue({
        status: 'success',
        amount: 60000, // (10 SMS * 15) + (10 WA * 25) + (100 EM * 2) = 150 + 250 + 200 = 600 NGN = 60000 kobo
      });

      const result = await service.purchaseCustom(
        branchId,
        reference,
        10,
        10,
        100,
      );

      expect(creditService.addCredits).toHaveBeenCalledTimes(3);
      expect(paymentsService.recordPayment).toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });

    it('should throw BadRequestException if custom expected amount is <= 0', async () => {
      await expect(
        service.purchaseCustom('branch-123', 'ref', 0, 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if custom payment verification fails', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(null);

      await expect(
        service.purchaseCustom('branch-123', 'ref-fail', 10, 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if paid amount is less than expected custom price', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue({
        amount: 10000, // 100 NGN instead of 150 NGN (10 SMS * 15)
      });

      await expect(
        service.purchaseCustom('branch-123', 'ref-low', 10, 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should short-circuit and return wallet if custom payment reference has already been processed (idempotency)', async () => {
      jest
        .spyOn(paymentsService, 'findByReference')
        .mockResolvedValueOnce({ id: 'pmt-456' } as any);

      const result = await service.purchaseCustom(
        'branch-123',
        'ref-custom-processed',
        10,
        10,
        10,
      );

      expect(creditService.addCredits).not.toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });
  });

  describe('getRates', () => {
    it('should retrieve rates from setting service', async () => {
      const result = await service.getRates();
      expect(result).toEqual({
        creditPriceSms: 15.0,
        creditPriceWhatsapp: 25.0,
        creditPriceEmail: 2.0,
      });
    });
  });
});
