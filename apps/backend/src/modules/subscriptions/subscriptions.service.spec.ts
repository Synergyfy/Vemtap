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
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subRepository: Repository<Subscription>;
  let plansService: PlansService;
  let paymentsService: PaymentsService;

  const mockPlan = {
    id: '1',
    name: 'Test Plan',
    isActive: true,
    isFree: false,
    monthlyPrice: 5000,
    trialDurationDays: 0,
    features: ['basic'],
    teamMembersLimit: 5,
    tagsLimit: 10,
    loyaltyLimit: 2,
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
    staff: [],
    devices: [],
    branches: [],
  };

  const mockSubscription = {
    id: 'sub1',
    businessId: 'b1',
    planId: '1',
    plan: mockPlan,
    status: SubscriptionStatus.ACTIVE,
    endDate: new Date(new Date().getTime() + 10000000), // future
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubRepository,
        },
        { provide: getRepositoryToken(Business), useValue: mockBusRepository },
        { provide: PlansService, useValue: mockPlansService },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subRepository = module.get(getRepositoryToken(Subscription));
    plansService = module.get(PlansService);
    paymentsService = module.get(PaymentsService);
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
      mockSubRepository.findOne.mockResolvedValue(null); // no active sub

      const result = await service.subscribe({
        planId: '3',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        isTrial: true,
      });

      expect(result.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.trialEndDate).toBeDefined();
      expect(mockPaymentsService.verifyTransaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequest if isTrial=true but plan has no trial', async () => {
      mockPlansService.findOne.mockResolvedValue(mockPlan); // 0 trial days

      await expect(
        service.subscribe({
          planId: '1',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          isTrial: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require payment if isTrial=false (default)', async () => {
      mockPlansService.findOne.mockResolvedValue(mockTrialPlan);

      await expect(
        service.subscribe({
          planId: '3',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          // isTrial defaults to false
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process direct payment if isTrial=false and reference provided', async () => {
      mockPlansService.findOne.mockResolvedValue(mockTrialPlan);
      mockSubRepository.findOne.mockResolvedValue(null);

      const result = await service.subscribe({
        planId: '3',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        paymentReference: 'ref123',
        isTrial: false,
      });

      expect(mockPaymentsService.verifyTransaction).toHaveBeenCalledWith(
        'ref123',
      );
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return status of active subscription', async () => {
      mockSubRepository.findOne.mockResolvedValueOnce(mockSubscription); // activeSubscription
      const status = await service.getSubscriptionStatus('b1');
      expect(status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should return status of latest subscription if no active one found', async () => {
      mockSubRepository.findOne.mockResolvedValueOnce(null); // activeSubscription returns null
      mockSubRepository.findOne.mockResolvedValueOnce({
        status: SubscriptionStatus.EXPIRED,
      }); // latest sub

      const status = await service.getSubscriptionStatus('b1');
      expect(status).toBe(SubscriptionStatus.EXPIRED);
    });

    it('should return null if no subscription ever', async () => {
      mockSubRepository.findOne.mockResolvedValueOnce(null);
      mockSubRepository.findOne.mockResolvedValueOnce(null);

      const status = await service.getSubscriptionStatus('b1');
      expect(status).toBeNull();
    });
  });
});
