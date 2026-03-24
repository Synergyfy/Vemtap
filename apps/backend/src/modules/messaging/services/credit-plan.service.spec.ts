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

describe('CreditPlanService', () => {
  let service: CreditPlanService;
  let creditPlanRepo: Repository<CreditPlan>;
  let paymentsService: PaymentsService;
  let creditService: CreditService;
  let branchesService: BranchesService;

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
      ],
    }).compile();

    service = module.get<CreditPlanService>(CreditPlanService);
    creditPlanRepo = module.get<Repository<CreditPlan>>(
      getRepositoryToken(CreditPlan),
    );
    paymentsService = module.get<PaymentsService>(PaymentsService);
    creditService = module.get<CreditService>(CreditService);
    branchesService = module.get<BranchesService>(BranchesService);
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
  });
});
