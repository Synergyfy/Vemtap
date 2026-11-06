import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreditPlanService } from './credit-plan.service';
import { CreditPlan } from '../entities/credit-plan.entity';
import {
  PaymentsService,
  type VerifiedTransaction,
} from '../../payments/payments.service';
import { CreditService } from './credit.service';
import { BranchesService } from '../../branches/branches.service';
import { SettingsService } from '../../settings/settings.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../../payments/entities/payment.entity';

/** A verified Paystack transaction for `amount` kobo. */
const paid = (amount: number): VerifiedTransaction => ({
  reference: 'ref',
  status: 'success',
  amount,
  currency: 'NGN',
  channel: 'card',
});

describe('CreditPlanService', () => {
  let service: CreditPlanService;
  let creditPlanRepo: Repository<CreditPlan>;
  let paymentsService: PaymentsService;
  let creditService: CreditService;

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
    creditPriceAi: 50.0,
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
            initializeTransaction: jest.fn().mockResolvedValue({
              reference: 'x',
              access_code: 'code',
              authorization_url: 'https://checkout.paystack.test/x',
            }),
            claimPending: jest.fn().mockResolvedValue(true),
            registerPurposeHandler: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchase', () => {
    it('should successfully award credits on valid payment', async () => {
      const reference = 'ref-123';
      const branchId = 'branch-123';

      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(
        paid(500000), // 5000 * 100
      );

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
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(
        paid(400000), // 4000 instead of 5000
      );

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
      jest.spyOn(paymentsService, 'findByReference').mockResolvedValueOnce({
        id: 'pmt-123',
        purpose: PaymentPurpose.CREDIT_TOPUP,
      } as any);

      const result = await service.purchase(
        'branch-123',
        'plan-123',
        'ref-processed',
      );

      expect(creditService.addCredits).not.toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });
  });

  describe('ownership', () => {
    it('refuses to credit a branch of another business', async () => {
      await expect(
        service.purchase('branch-123', 'plan-123', 'ref', 'biz-other'),
      ).rejects.toThrow('That branch is not part of your business');
      expect(paymentsService.verifyTransaction).not.toHaveBeenCalled();
    });

    it('refuses a reference that is not a credit top-up', async () => {
      jest
        .spyOn(paymentsService, 'findByReference')
        .mockResolvedValueOnce({ purpose: PaymentPurpose.ORDER } as any);
      await expect(
        service.purchase('branch-123', 'plan-123', 'ref', 'biz-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkout', () => {
    const owner = {
      id: 'user-1',
      email: 'owner@example.com',
      businessId: 'biz-123',
      branchId: 'branch-123',
    };
    const pending = {
      reference: 'CRD-1',
      amount: 5000,
      purpose: PaymentPurpose.CREDIT_TOPUP,
      status: PaymentStatus.PENDING,
      businessId: 'biz-123',
      metadata: { planId: 'plan-123' },
    };

    it('records a pending payment for the caller and returns the pay page', async () => {
      const result = await service.startCheckout(
        owner,
        'plan-123',
        'app://back',
      );

      expect(paymentsService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          purpose: PaymentPurpose.CREDIT_TOPUP,
          status: PaymentStatus.PENDING,
          businessId: 'biz-123',
          metadata: expect.objectContaining({ planId: 'plan-123' }),
        }),
      );
      expect(paymentsService.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500000, callbackUrl: 'app://back' }),
      );
      expect(result.authorizationUrl).toBe('https://checkout.paystack.test/x');
      expect(result.reference).toMatch(/^CRD-/);
    });

    it('needs a business account', async () => {
      await expect(
        service.startCheckout({ ...owner, businessId: null }, 'plan-123'),
      ).rejects.toThrow('Credits are bought by a business account');
    });

    it('hides another business’s checkout', async () => {
      jest
        .spyOn(paymentsService, 'findByReference')
        .mockResolvedValueOnce(pending as any);
      await expect(
        service.confirmCheckout('biz-other', 'CRD-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('awards a paid checkout and reports it completed', async () => {
      jest
        .spyOn(paymentsService, 'findByReference')
        .mockResolvedValueOnce(pending as any);
      jest
        .spyOn(paymentsService, 'verifyTransaction')
        .mockResolvedValueOnce(paid(500000));

      const result = await service.confirmCheckout('biz-123', 'CRD-1');

      expect(result.status).toBe('completed');
      expect(paymentsService.claimPending).toHaveBeenCalledWith('CRD-1');
      expect(creditService.addCredits).toHaveBeenCalledTimes(3);
    });

    it('awards nothing when the webhook already claimed it', async () => {
      jest
        .spyOn(paymentsService, 'verifyTransaction')
        .mockResolvedValueOnce(paid(500000));
      jest.spyOn(paymentsService, 'claimPending').mockResolvedValueOnce(false);

      await expect(service.completeCheckout(pending as any)).resolves.toBe(
        true,
      );
      expect(creditService.addCredits).not.toHaveBeenCalled();
    });

    it('stays pending while Paystack has not been paid in full', async () => {
      jest
        .spyOn(paymentsService, 'verifyTransaction')
        .mockResolvedValueOnce(paid(100));

      await expect(service.completeCheckout(pending as any)).resolves.toBe(
        false,
      );
      expect(paymentsService.claimPending).not.toHaveBeenCalled();
    });
  });

  describe('purchaseCustom', () => {
    it('should successfully award custom credits on valid payment', async () => {
      const reference = 'ref-custom-123';
      const branchId = 'branch-123';

      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(
        paid(110000), // (10 SMS * 15) + (10 WA * 25) + (100 EM * 2) + (10 AI * 50) = 150 + 250 + 200 + 500 = 1100 NGN = 110000 kobo
      );

      const result = await service.purchaseCustom(
        branchId,
        reference,
        10,
        10,
        100,
        10,
      );

      expect(creditService.addCredits).toHaveBeenCalledTimes(4);
      expect(paymentsService.recordPayment).toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });

    it('should throw BadRequestException if custom expected amount is <= 0', async () => {
      await expect(
        service.purchaseCustom('branch-123', 'ref', 0, 0, 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if custom payment verification fails', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(null);

      await expect(
        service.purchaseCustom('branch-123', 'ref-fail', 10, 0, 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if paid amount is less than expected custom price', async () => {
      jest.spyOn(paymentsService, 'verifyTransaction').mockResolvedValue(
        paid(10000), // 100 NGN instead of 150 NGN (10 SMS * 15)
      );

      await expect(
        service.purchaseCustom('branch-123', 'ref-low', 10, 0, 0, 0),
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
        0,
      );

      expect(creditService.addCredits).not.toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });
  });

  describe('getRates', () => {
    it('should retrieve rates from setting service including AI credits', async () => {
      const result = await service.getRates();
      expect(result).toEqual({
        creditPriceSms: 15.0,
        creditPriceWhatsapp: 25.0,
        creditPriceEmail: 2.0,
        creditPriceAi: 50.0,
      });
    });
  });
});
