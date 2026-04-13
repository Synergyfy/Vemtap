import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from './entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { PlansService } from './plans.service';
import { PaymentsService } from '../payments/payments.service';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueCategory } from '../catalogue/entities/catalogue-category.entity';
import { Device } from '../devices/entities/device.entity';
import { CreditService } from '../messaging/services/credit.service';
import { AutomationRule } from '../messaging/entities/automation-rule.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPlan = {
    id: '1',
    name: 'Test Plan',
    isActive: true,
    isFree: false,
    monthlyPrice: 5000,
    trialDurationDays: 0,
    features: ['basic'],
    messagingEnabled: true,
    analyticsEnabled: true,
    teamMembersEnabled: true,
    branchesEnabled: true,
    teamMembersLimit: 5,
    loyaltyLimit: 2,
    branchLimit: 3,
    analyticsLevel: 'basic',
  };

  const mockTrialPlan = {
    ...mockPlan,
    id: '3',
    name: 'Trial Plan',
    trialDurationDays: 30,
  };

  const mockFreePlan = {
    ...mockPlan,
    id: '2',
    name: 'Free Plan',
    isFree: true,
    monthlyPrice: 0,
    trialDurationDays: 0,
  };

  const mockBusiness = {
    id: 'b1',
    name: 'Test Business',
    ownerId: 'u1',
    branches: [],
  };

  const mockSubscription = {
    id: 'sub1',
    businessId: 'b1',
    planId: '1',
    plan: mockPlan,
    status: SubscriptionStatus.ACTIVE,
    endDate: new Date(new Date().getTime() + 10000000),
  };

  const mockSubRepository = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((sub) => Promise.resolve({ id: 'newSub', ...sub })),
    create: jest.fn().mockImplementation((dto) => dto),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockBusRepository = {
    findOne: jest.fn().mockResolvedValue(mockBusiness),
  };

  const mockUserRepo = { update: jest.fn() };
  const mockBranchRepo = { find: jest.fn() };
  const mockDeviceRepo = { count: jest.fn() };

  const mockPlansService = {
    findOne: jest.fn().mockResolvedValue(mockPlan),
    findAll: jest.fn().mockResolvedValue([mockFreePlan, mockPlan]),
  };

  const mockPaymentsService = {
    verifyTransaction: jest.fn().mockResolvedValue({
      status: 'success',
      data: {
        amount: 5000,
      },
      authorization: { authorization_code: 'AUTH_123' },
    }),
    recordPayment: jest.fn().mockResolvedValue({}),
    chargeAuthorization: jest.fn(),
  };

  const mockCreditService = {
    allocateSubscriptionCredits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(CatalogueItem), useValue: {} },
        { provide: getRepositoryToken(CatalogueOffer), useValue: {} },
        { provide: getRepositoryToken(CatalogueCategory), useValue: {} },
        { provide: getRepositoryToken(AutomationRule), useValue: {} },
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubRepository,
        },
        { provide: getRepositoryToken(Business), useValue: mockBusRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
        { provide: PlansService, useValue: mockPlansService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: CreditService, useValue: mockCreditService },
        {
          provide: 'DataSource',
          useValue: { transaction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('subscribe', () => {
    it('should create subscription with TRIAL status if isTrial=true and plan has trial', async () => {
      mockPlansService.findOne.mockResolvedValue(mockTrialPlan);
      mockSubRepository.findOne.mockResolvedValue(null);
      mockBranchRepo.find.mockResolvedValue([]);

      const result = await service.subscribe({
        planId: '3',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        isTrial: true,
      });

      expect(result.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.trialEndDate).toBeDefined();
    });

    it('should throw BadRequest if isTrial=true but plan has no trial', async () => {
      mockPlansService.findOne.mockResolvedValue(mockPlan);

      await expect(
        service.subscribe({
          planId: '1',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          isTrial: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return status of active subscription', async () => {
      mockSubRepository.findOne.mockResolvedValueOnce(mockSubscription);
      const status = await service.getSubscriptionStatus('b1');
      expect(status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('automated processes', () => {
    it('should renew active subscriptions that have reached end date', async () => {
      const expiringSub = {
        ...mockSubscription,
        endDate: new Date(new Date().getTime() - 1000), // Past
        paystackAuthorizationCode: 'AUTH_123',
        billingPeriod: BillingPeriod.MONTHLY,
      };

      mockSubRepository.find.mockResolvedValueOnce([expiringSub]);
      mockPaymentsService.chargeAuthorization.mockResolvedValue({ status: 'success', reference: 'REF_123' });

      await service.processRenewals();

      expect(mockPaymentsService.chargeAuthorization).toHaveBeenCalledWith(
        mockPlan.monthlyPrice,
        'billing@latap.com',
        'AUTH_123',
      );
      expect(mockSubRepository.save).toHaveBeenCalled();
      expect(mockCreditService.allocateSubscriptionCredits).toHaveBeenCalled();
    });

    it('should expire trial subscriptions that have reached end date', async () => {
      const expiredTrial = {
        ...mockSubscription,
        status: SubscriptionStatus.TRIAL,
        endDate: new Date(new Date().getTime() - 1000), // Past
        paystackAuthorizationCode: null,
      };

      mockSubRepository.find.mockResolvedValueOnce([expiredTrial]);

      await service.processExpiredTrials();

      expect(expiredTrial.status).toBe(SubscriptionStatus.EXPIRED);
      expect(mockSubRepository.save).toHaveBeenCalledWith(expiredTrial);
    });

    it('should charge and activate trial subscriptions that have auth code', async () => {
      const trialWithAuth = {
        ...mockSubscription,
        status: SubscriptionStatus.TRIAL,
        endDate: new Date(new Date().getTime() - 1000),
        paystackAuthorizationCode: 'AUTH_TRIAL',
        billingPeriod: BillingPeriod.MONTHLY,
      };

      mockSubRepository.find.mockResolvedValueOnce([trialWithAuth]);
      mockPaymentsService.chargeAuthorization.mockResolvedValue({ status: 'success', reference: 'REF_TRIAL' });
      mockBranchRepo.find.mockResolvedValue([]);

      await service.processExpiredTrials();

      expect(mockPaymentsService.chargeAuthorization).toHaveBeenCalledWith(
        mockPlan.monthlyPrice,
        'billing@latap.com',
        'AUTH_TRIAL',
      );
      expect(trialWithAuth.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
