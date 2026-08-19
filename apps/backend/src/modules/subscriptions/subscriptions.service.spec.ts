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
import { AddonsService } from './services/addons.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { AffiliateSyncService } from '../affiliates/affiliate-sync.service';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { BranchesService } from '../branches/branches.service';
import { Reward } from '../loyalty/entities/reward.entity';
import { SubscriptionTaxService } from './services/subscription-tax.service';
import { CouponEngineService } from '../coupons/services/coupon-engine.service';
import { MailService } from '../mail/mail.service';

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
    permissionsConfiguredAt: new Date(),
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

  const mockUserRepo = {
    update: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'owner@example.com',
      firstName: 'John',
      lastName: 'Doe',
    }),
  };
  const mockBranchRepo = { find: jest.fn() };
  const mockDeviceRepo = { count: jest.fn() };
  const mockMailService = {
    sendPlanChangeEmail: jest.fn().mockResolvedValue(true),
  };

  const mockPlansService = {
    findOne: jest.fn().mockResolvedValue(mockPlan),
    findAll: jest.fn().mockResolvedValue([mockFreePlan, mockPlan]),
  };

  const mockPaymentsService = {
    verifyTransaction: jest.fn().mockResolvedValue({
      status: 'success',
      amount: 500000,
      currency: 'NGN',
      channel: 'card',
      authorization: { authorization_code: 'AUTH_123' },
    }),
    recordPayment: jest.fn().mockResolvedValue({}),
    chargeAuthorization: jest.fn(),
  };

  const mockCreditService = {
    allocateSubscriptionCredits: jest.fn(),
  };

  const mockAddonsService = {
    getAddonCapabilities: jest.fn().mockResolvedValue({}),
    getActiveBusinessAddons: jest.fn().mockResolvedValue([]),
    validateAddons: jest.fn().mockResolvedValue([]),
    purchasePlanWithAddons: jest.fn().mockResolvedValue([]),
  };

  const mockAffiliatesService = {
    processSubscriptionCommission: jest.fn(),
    processBusinessReferralCommission: jest.fn(),
    getCommissionRateForBusiness: jest
      .fn()
      .mockResolvedValue({ isFirstPayment: true, rate: 30 }),
  };
  const mockAffiliateSyncService = { enqueueRecordReferral: jest.fn() };
  const mockQrThriveService = { syncSubscription: jest.fn() };
  const mockBranchesService = {
    findBusinessByOwner: jest.fn(),
    findById: jest.fn(),
  };

  const mockSubscriptionTaxService = {
    getActiveConfig: jest.fn().mockResolvedValue({
      id: 'tax-1',
      name: 'VAT',
      taxType: 'percentage',
      rate: 7.5,
      isEnabled: false,
      isActive: true,
    }),
    calculateTax: jest.fn().mockImplementation((subtotal, config) => {
      if (!config?.isEnabled) {
        return {
          subtotal,
          taxAmount: 0,
          total: subtotal,
          taxRule: {
            name: 'VAT',
            taxType: 'percentage',
            rate: 7.5,
            isEnabled: false,
          },
        };
      }
      const taxAmount = (subtotal * config.rate) / 100;
      return {
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        taxRule: {
          name: config.name,
          taxType: config.taxType,
          rate: config.rate,
          isEnabled: true,
        },
      };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(CatalogueItem),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getRepositoryToken(CatalogueCategory),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
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
        { provide: AddonsService, useValue: mockAddonsService },
        { provide: SubscriptionTaxService, useValue: mockSubscriptionTaxService },
        { provide: AffiliatesService, useValue: mockAffiliatesService },
        {
          provide: AffiliateSyncService,
          useValue: mockAffiliateSyncService,
        },
        { provide: QrThriveService, useValue: mockQrThriveService },
        { provide: BranchesService, useValue: mockBranchesService },
        {
          provide: CouponEngineService,
          useValue: {
            validatePromotion: jest.fn(),
            recordRedemption: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
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

      expect(result.subscription.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.subscription.trialEndDate).toBeDefined();
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

    it('should apply customEndDate if isAdminOverride is true and customEndDate is provided', async () => {
      mockPlansService.findOne.mockResolvedValue(mockPlan);
      mockSubRepository.findOne.mockResolvedValue(null);
      mockBranchRepo.find.mockResolvedValue([]);

      const customEndDateStr = '2030-12-31T23:59:59.000Z';
      const result = await service.subscribe({
        planId: '1',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        isAdminOverride: true,
        customEndDate: customEndDateStr,
      });

      expect(result.subscription.endDate.toISOString()).toBe(customEndDateStr);
      expect(mockMailService.sendPlanChangeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          customerName: 'John Doe',
          businessName: 'Test Business',
          planName: 'Test Plan',
          isAdminOverride: true,
        }),
      );
    });

    describe('permissions guard', () => {
      it('should allow free plan even without permissionsConfiguredAt', async () => {
        const freePlanNoPerms = {
          ...mockFreePlan,
          permissionsConfiguredAt: null,
        };
        mockPlansService.findOne.mockResolvedValue(freePlanNoPerms);
        mockSubRepository.findOne.mockResolvedValue(null);
        mockBranchRepo.find.mockResolvedValue([]);

        const result = await service.subscribe({
          planId: '2',
          businessId: 'b1',
          billingPeriod: BillingPeriod.YEARLY,
        });

        expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      });

      it('should throw BadRequest if paid plan has null permissionsConfiguredAt', async () => {
        const paidPlanNoPerms = {
          ...mockPlan,
          permissionsConfiguredAt: null,
        };
        mockPlansService.findOne.mockResolvedValue(paidPlanNoPerms);

        await expect(
          service.subscribe({
            planId: '1',
            businessId: 'b1',
            billingPeriod: BillingPeriod.MONTHLY,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow paid plan if permissionsConfiguredAt is set', async () => {
        const paidPlanWithPerms = {
          ...mockPlan,
          permissionsConfiguredAt: new Date(),
        };
        mockPlansService.findOne.mockResolvedValue(paidPlanWithPerms);
        mockSubRepository.findOne.mockResolvedValue(null);
        mockBranchRepo.find.mockResolvedValue([]);
        mockPaymentsService.verifyTransaction.mockResolvedValue({
          status: 'success',
          amount: 500000,
          currency: 'NGN',
          channel: 'card',
          authorization: { authorization_code: 'AUTH_123' },
        });

        const result = await service.subscribe({
          planId: '1',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          paymentReference: 'PAY_123',
        });

        expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      });

      it('should allow admin override even without permissionsConfiguredAt', async () => {
        const paidPlanNoPerms = {
          ...mockPlan,
          permissionsConfiguredAt: null,
        };
        mockPlansService.findOne.mockResolvedValue(paidPlanNoPerms);
        mockSubRepository.findOne.mockResolvedValue(null);
        mockBranchRepo.find.mockResolvedValue([]);

        const result = await service.subscribe({
          planId: '1',
          businessId: 'b1',
          billingPeriod: BillingPeriod.MONTHLY,
          isAdminOverride: true,
        });

        expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      });
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
      mockPaymentsService.chargeAuthorization.mockResolvedValue({
        status: 'success',
        reference: 'REF_123',
      });

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
      mockPaymentsService.chargeAuthorization.mockResolvedValue({
        status: 'success',
        reference: 'REF_TRIAL',
      });
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

  describe('getCapabilities', () => {
    it('should return capability features and correctly treat -1 as unlimited for teamMembers and loyaltyPrograms', async () => {
      const unlimitedPlan = {
        ...mockPlan,
        teamMembersEnabled: true,
        teamMembersLimit: -1,
        loyaltyEnabled: true,
        loyaltyLimit: -1,
        automationsEnabled: true,
        maxAutomations: -1,
      };

      const activeSub = {
        ...mockSubscription,
        plan: unlimitedPlan,
      };

      mockSubRepository.findOne.mockResolvedValueOnce(activeSub);
      mockBranchRepo.find.mockResolvedValueOnce([
        { id: 'br-1', isMainBranch: true },
      ]);
      mockUserRepo.count.mockResolvedValueOnce(2);
      mockDeviceRepo.count.mockResolvedValueOnce(0);

      const result = await service.getCapabilities('b1');

      expect(result.capabilities.teamMembers).toEqual({
        enabled: true,
        limit: 'unlimited',
        used: 2,
        remaining: 'unlimited',
      });

      expect(result.capabilities.loyaltyPrograms).toEqual({
        enabled: true,
        limit: 'unlimited',
        used: 0,
        remaining: 'unlimited',
      });

      expect(result.capabilities.automations).toEqual({
        enabled: true,
        limit: 'unlimited',
        used: 0,
        remaining: 'unlimited',
      });
    });

    it('should return capability features and correctly treat positive limits as finite for teamMembers and loyaltyPrograms', async () => {
      const finitePlan = {
        ...mockPlan,
        teamMembersEnabled: true,
        teamMembersLimit: 5,
        loyaltyEnabled: true,
        loyaltyLimit: 3,
        maxAutomations: 10,
      };

      const activeSub = {
        ...mockSubscription,
        plan: finitePlan,
      };

      mockSubRepository.findOne.mockResolvedValueOnce(activeSub);
      mockBranchRepo.find.mockResolvedValueOnce([
        { id: 'br-1', isMainBranch: true },
      ]);
      mockUserRepo.count.mockResolvedValueOnce(2);
      mockDeviceRepo.count.mockResolvedValueOnce(0);

      const result = await service.getCapabilities('b1');

      expect(result.capabilities.teamMembers).toEqual({
        enabled: true,
        limit: 5,
        used: 2,
        remaining: 3,
      });

      expect(result.capabilities.loyaltyPrograms).toEqual({
        enabled: true,
        limit: 3,
        used: 0,
        remaining: 3,
      });
    });

    it('should treat null limits as 0/disabled and not unlimited', async () => {
      const nullLimitPlan = {
        ...mockPlan,
        teamMembersEnabled: true,
        teamMembersLimit: null,
        loyaltyEnabled: true,
        loyaltyLimit: null,
        automationsEnabled: true,
        maxAutomations: null,
      };

      const activeSub = {
        ...mockSubscription,
        plan: nullLimitPlan,
      };

      mockSubRepository.findOne.mockResolvedValueOnce(activeSub);
      mockBranchRepo.find.mockResolvedValueOnce([
        { id: 'br-1', isMainBranch: true },
      ]);
      mockUserRepo.count.mockResolvedValueOnce(2);
      mockDeviceRepo.count.mockResolvedValueOnce(0);

      const result = await service.getCapabilities('b1');

      expect(result.capabilities.teamMembers).toEqual({
        enabled: true,
        limit: 0,
        used: 2,
        remaining: 0,
      });

      expect(result.capabilities.loyaltyPrograms).toEqual({
        enabled: true,
        limit: 0,
        used: 0,
        remaining: 0,
      });

      expect(result.capabilities.automations).toEqual({
        enabled: true,
        limit: 0,
        used: 0,
        remaining: 0,
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription successfully', async () => {
      mockSubRepository.findOne.mockResolvedValueOnce(mockSubscription);
      mockSubRepository.save.mockImplementationOnce((sub) =>
        Promise.resolve(sub),
      );

      const result = await service.cancelSubscription('b1');
      expect(result.message).toBe('Subscription cancelled successfully');
      expect(result.subscription.status).toBe(SubscriptionStatus.CANCELED);
    });
  });

  describe('previewPrice', () => {
    it('should calculate price preview with tax breakdown', async () => {
      mockPlansService.findOne.mockResolvedValueOnce({
        id: 'plan-1',
        name: 'Pro Plan',
        monthlyPrice: 10000,
      });

      mockSubscriptionTaxService.getActiveConfig.mockResolvedValueOnce({
        id: 'tax-1',
        name: 'VAT',
        taxType: 'percentage',
        rate: 7.5,
        isEnabled: true,
      });

      const result = await service.previewPrice({
        planId: 'plan-1',
        billingPeriod: BillingPeriod.MONTHLY,
      });

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(750);
      expect(result.total).toBe(10750);
      expect(result.plan.name).toBe('Pro Plan');
    });

    it('should handle empty or blank addonIds and promoCode gracefully without crashing', async () => {
      mockPlansService.findOne.mockResolvedValueOnce({
        id: 'plan-1',
        name: 'Pro Plan',
        monthlyPrice: 10000,
      });

      mockSubscriptionTaxService.getActiveConfig.mockResolvedValueOnce({
        id: 'tax-1',
        name: 'VAT',
        taxType: 'percentage',
        rate: 7.5,
        isEnabled: true,
      });

      const result = await service.previewPrice({
        planId: 'plan-1',
        billingPeriod: BillingPeriod.MONTHLY,
        addonIds: [] as any,
        promoCode: '   ',
      });

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(750);
      expect(result.total).toBe(10750);
      expect(mockAddonsService.validateAddons).not.toHaveBeenCalled();
    });
  });
});
