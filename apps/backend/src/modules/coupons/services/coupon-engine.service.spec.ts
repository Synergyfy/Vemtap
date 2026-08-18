import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponEngineService } from './coupon-engine.service';
import { Coupon, DiscountType, CouponDuration } from '../entities/coupon.entity';
import { PromotionCode } from '../entities/promotion-code.entity';
import { CouponRedemption } from '../entities/coupon-redemption.entity';
import { Plan } from '../../subscriptions/entities/plan.entity';
import {
  Subscription,
  BillingPeriod,
} from '../../subscriptions/entities/subscription.entity';
import {
  SubscriptionTaxService,
  TaxCalculationResult,
} from '../../subscriptions/services/subscription-tax.service';
import { TaxType } from '../../subscriptions/entities/subscription-tax-config.entity';

describe('CouponEngineService', () => {
  let service: CouponEngineService;
  let promoCodeRepo: any;
  let couponRepo: any;
  let redemptionRepo: any;
  let subscriptionRepo: any;
  let planRepo: any;
  let taxService: any;

  const mockPlan: Plan = {
    id: 'plan-pro-id',
    name: 'Pro Plan',
    monthlyPrice: 10000,
    quarterlyPrice: 27000,
    yearlyPrice: 100000,
    currency: 'NGN',
    isFree: false,
    trialDurationDays: 14,
    features: [],
    messagingEnabled: true,
    smsCredits: 100,
    emailCredits: 500,
    whatsappCredits: 50,
    teamMembersEnabled: true,
    teamMembersLimit: 5,
    loyaltyLimit: null,
    loyaltyEnabled: true,
    branchesEnabled: true,
    branchLimit: 3,
    analyticsEnabled: true,
    analyticsLevel: 'advanced',
    catalogueEnabled: true,
    maxCatalogueItems: 100,
    maxCatalogueCategories: 10,
    maxCatalogueOffers: 5,
    automationsEnabled: true,
    maxAutomations: 10,
    isActive: true,
    description: 'Pro plan for businesses',
    qrThrivePlanId: null,
    isPopular: true,
    inventoryEnabled: true,
    inventoryLimit: 500,
    posEnabled: true,
    posTerminalLimit: 2,
    visitorsEnabled: true,
    inAppChatEnabled: true,
    formsEnabled: true,
    formsLimit: 10,
    businessQrEnabled: true,
    marketingKitEnabled: true,
    marketingKitLimit: 5,
    discoveryEnabled: true,
    staffRolesEnabled: true,
    staffRolesLimit: 5,
    activityLogEnabled: true,
    qrCodesEnabled: true,
    qrCodesLimit: 10,
    aiCopilotEnabled: true,
    aiCredits: 100,
    permissionsConfiguredAt: new Date(),
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  };

  const mockCoupon: Coupon = {
    id: 'coupon-1',
    name: '20% Off Launch',
    discountType: DiscountType.PERCENTAGE,
    amount: 20,
    currency: 'NGN',
    maxDiscountAmount: 5000,
    minSubtotal: null,
    duration: CouponDuration.ONCE,
    durationInMonths: null,
    applicablePlanIds: [],
    applicableBillingPeriods: [],
    isActive: true,
    createdById: 'admin-1',
    createdBy: null,
    promotionCodes: [],
    redemptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  };

  const mockPromoCode: PromotionCode = {
    id: 'promo-1',
    couponId: 'coupon-1',
    coupon: mockCoupon,
    code: 'SAVE20',
    isActive: true,
    startsAt: null,
    expiresAt: null,
    maxRedemptions: 100,
    timesRedeemed: 10,
    maxRedemptionsPerUser: 1,
    firstTimeOnly: false,
    allowedBusinessIds: [],
    createdById: 'admin-1',
    createdBy: null,
    redemptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  };

  beforeEach(async () => {
    promoCodeRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockPromoCode, coupon: { ...mockCoupon } }),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    couponRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockCoupon }),
    };

    redemptionRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (dto) => ({ id: 'redemption-uuid', ...dto })),
    };

    subscriptionRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    planRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockPlan }),
    };

    taxService = {
      getActiveConfig: jest.fn().mockResolvedValue({
        name: 'VAT',
        taxType: TaxType.PERCENTAGE,
        rate: 7.5,
        isEnabled: true,
      }),
      calculateTax: jest.fn().mockImplementation((subtotal, config) => {
        const rate = config?.isEnabled ? Number(config.rate || 0) : 0;
        const taxAmount = (subtotal * rate) / 100;
        return {
          subtotal,
          taxAmount,
          total: subtotal + taxAmount,
          taxRule: {
            name: 'VAT',
            taxType: TaxType.PERCENTAGE,
            rate: 7.5,
            isEnabled: true,
          },
        };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponEngineService,
        { provide: getRepositoryToken(Coupon), useValue: couponRepo },
        { provide: getRepositoryToken(PromotionCode), useValue: promoCodeRepo },
        { provide: getRepositoryToken(CouponRedemption), useValue: redemptionRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(Plan), useValue: planRepo },
        { provide: SubscriptionTaxService, useValue: taxService },
      ],
    }).compile();

    service = module.get<CouponEngineService>(CouponEngineService);
  });

  describe('validatePromotion', () => {
    it('should successfully calculate percentage discount and VAT', async () => {
      const result = await service.validatePromotion({
        code: 'SAVE20',
        planId: 'plan-pro-id',
        billingPeriod: BillingPeriod.MONTHLY,
        businessId: 'biz-123',
      });

      expect(result.isValid).toBe(true);
      expect(result.originalPlanPrice).toBe(10000);
      expect(result.discountAmount).toBe(2000); // 20% of 10000
      expect(result.discountedPlanPrice).toBe(8000);
      expect(result.netSubtotal).toBe(8000);
      expect(result.taxAmount).toBe(600); // 7.5% of 8000
      expect(result.total).toBe(8600);
    });

    it('should respect maxDiscountAmount cap on percentage discounts', async () => {
      const result = await service.validatePromotion({
        code: 'SAVE20',
        planId: 'plan-pro-id',
        billingPeriod: BillingPeriod.YEARLY, // 100,000 * 20% = 20,000 > cap of 5,000
        businessId: 'biz-123',
      });

      expect(result.originalPlanPrice).toBe(100000);
      expect(result.discountAmount).toBe(5000); // Capped at 5000
      expect(result.discountedPlanPrice).toBe(95000);
      expect(result.total).toBe(95000 + 95000 * 0.075);
    });

    it('should calculate fixed amount discount accurately', async () => {
      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        coupon: {
          ...mockCoupon,
          discountType: DiscountType.FIXED_AMOUNT,
          amount: 3000,
        },
      });

      const result = await service.validatePromotion({
        code: 'SAVE20',
        planId: 'plan-pro-id',
        billingPeriod: BillingPeriod.MONTHLY,
        businessId: 'biz-123',
      });

      expect(result.discountAmount).toBe(3000);
      expect(result.discountedPlanPrice).toBe(7000);
      expect(result.total).toBe(7000 + 7000 * 0.075);
    });

    it('should throw BadRequestException if promotion code is inactive', async () => {
      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        isActive: false,
      });

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if code has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        expiresAt: pastDate,
      });

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max redemptions reached', async () => {
      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        maxRedemptions: 10,
        timesRedeemed: 10,
      });

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if per-user redemption limit reached', async () => {
      redemptionRepo.count.mockResolvedValueOnce(1); // Already redeemed 1 time (max: 1)

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
          businessId: 'biz-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if firstTimeOnly and user has prior subscription', async () => {
      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        firstTimeOnly: true,
      });
      subscriptionRepo.count.mockResolvedValueOnce(2); // Has prior subscriptions

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
          businessId: 'biz-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if plan is not in applicablePlanIds', async () => {
      promoCodeRepo.findOne.mockResolvedValueOnce({
        ...mockPromoCode,
        coupon: {
          ...mockCoupon,
          applicablePlanIds: ['other-plan-id'],
        },
      });

      await expect(
        service.validatePromotion({
          code: 'SAVE20',
          planId: 'plan-pro-id',
          billingPeriod: BillingPeriod.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordRedemption', () => {
    it('should atomically increment timesRedeemed and save redemption record', async () => {
      const result = await service.recordRedemption({
        promotionCodeId: 'promo-1',
        couponId: 'coupon-1',
        businessId: 'biz-1',
        userId: 'user-1',
        subscriptionId: 'sub-1',
        paymentReference: 'PAY_REF_123',
        planId: 'plan-pro-id',
        billingPeriod: BillingPeriod.MONTHLY,
        originalAmount: 10000,
        discountAmount: 2000,
        taxAmount: 600,
        finalAmount: 8600,
      });

      expect(promoCodeRepo.createQueryBuilder).toHaveBeenCalled();
      expect(redemptionRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('redemption-uuid');
      expect(result.paymentReference).toBe('PAY_REF_123');
    });
  });
});
