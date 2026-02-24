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
import { Repository, In } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { PaymentPurpose, PaymentStatus } from '../payments/entities/payment.entity';

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
    verifyTransaction: jest.fn().mockResolvedValue(true),
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

  describe('activeSubscription', () => {
    it('should return active subscription', async () => {
      mockSubRepository.findOne.mockResolvedValue(mockSubscription);
      const sub = await service.activeSubscription('b1');
      expect(sub).toEqual(mockSubscription);
      expect(mockSubRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'b1',
            status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
          },
        }),
      );
    });
  });

  describe('subscribe', () => {
    it('should create subscription with TRIAL status if plan has trial', async () => {
      mockPlansService.findOne.mockResolvedValue(mockTrialPlan);
      mockSubRepository.findOne.mockResolvedValue(null); // no active sub

      const result = await service.subscribe({
        planId: '3',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
      });

      expect(result.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.trialEndDate).toBeDefined();
      // Should calculate trial end date approx 30 days from now
      const now = new Date().getTime();
      const trialEnd = new Date(result.trialEndDate).getTime();
      const diff = trialEnd - now;
      const day = 24 * 60 * 60 * 1000;
      expect(diff).toBeGreaterThan(29 * day);
      expect(diff).toBeLessThan(31 * day);

      expect(mockPaymentsService.verifyTransaction).not.toHaveBeenCalled();
    });

    it('should require payment for paid plan without trial', async () => {
      mockPlansService.findOne.mockResolvedValue(mockPlan); // 0 trial days
      mockSubRepository.findOne.mockResolvedValue(null);

      await expect(
        service.subscribe({
          planId: '1',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException); // missing ref

      // With ref
      const result = await service.subscribe({
        planId: '1',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        paymentReference: 'ref123',
      });

      expect(mockPaymentsService.verifyTransaction).toHaveBeenCalledWith(
        'ref123',
      );
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should save auth code if verification provides it', async () => {
        mockPlansService.findOne.mockResolvedValue(mockTrialPlan);
        mockSubRepository.findOne.mockResolvedValue(null);
        mockPaymentsService.verifyTransaction.mockResolvedValueOnce({
            authorization: { authorization_code: 'AUTH_123' }
        });

        const result = await service.subscribe({
          planId: '3',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          paymentReference: 'ref_with_auth',
        });

        expect(result.paystackAuthorizationCode).toBe('AUTH_123');
    });
  });

  describe('processExpiredTrials', () => {
    it('should charge and activate expired trials with auth code', async () => {
        const expiredSub = {
            id: 'sub_expired',
            status: SubscriptionStatus.TRIAL,
            endDate: new Date(), // Just expired
            paystackAuthorizationCode: 'AUTH_123',
            plan: mockPlan,
            billingPeriod: BillingPeriod.MONTHLY,
            businessId: 'b1',
            business: mockBusiness,
        };
        mockSubRepository.find.mockResolvedValueOnce([expiredSub]);

        mockPaymentsService.chargeAuthorization.mockResolvedValueOnce({
            status: 'success',
            reference: 'charge_ref',
        });

        await service.processExpiredTrials();

        expect(mockPaymentsService.chargeAuthorization).toHaveBeenCalledWith(
            5000, 'unknown@latap.com', 'AUTH_123'
        );
        expect(mockSubRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'sub_expired',
            status: SubscriptionStatus.ACTIVE,
        }));
        expect(mockPaymentsService.recordPayment).toHaveBeenCalled();
    });

    it('should expire trials without auth code', async () => {
        const expiredSub = {
            id: 'sub_no_auth',
            status: SubscriptionStatus.TRIAL,
            endDate: new Date(),
            paystackAuthorizationCode: null,
            plan: mockPlan,
        };
        mockSubRepository.find.mockResolvedValueOnce([expiredSub]);

        await service.processExpiredTrials();

        expect(mockPaymentsService.chargeAuthorization).not.toHaveBeenCalled();
        expect(mockSubRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            status: SubscriptionStatus.EXPIRED
        }));
    });

    it('should expire trials if charge fails', async () => {
        const expiredSub = {
            id: 'sub_fail',
            status: SubscriptionStatus.TRIAL,
            endDate: new Date(),
            paystackAuthorizationCode: 'AUTH_FAIL',
            plan: mockPlan,
            billingPeriod: BillingPeriod.MONTHLY,
            businessId: 'b1',
            business: mockBusiness,
        };
        mockSubRepository.find.mockResolvedValueOnce([expiredSub]);
        mockPaymentsService.chargeAuthorization.mockResolvedValueOnce(null);

        await service.processExpiredTrials();

        expect(mockSubRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            status: SubscriptionStatus.EXPIRED
        }));
    });
  });
});
