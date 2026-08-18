import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, DiscountType } from '../entities/coupon.entity';
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

export interface PromotionValidationResult {
  isValid: boolean;
  coupon: Coupon;
  promotionCode: PromotionCode;
  originalPlanPrice: number;
  discountAmount: number;
  discountedPlanPrice: number;
  addonsSubtotal: number;
  netSubtotal: number;
  taxAmount: number;
  total: number;
  taxRule: TaxCalculationResult['taxRule'];
}

@Injectable()
export class CouponEngineService {
  private readonly logger = new Logger(CouponEngineService.name);

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(PromotionCode)
    private readonly promoCodeRepository: Repository<PromotionCode>,
    @InjectRepository(CouponRedemption)
    private readonly redemptionRepository: Repository<CouponRedemption>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly subscriptionTaxService: SubscriptionTaxService,
  ) {}

  /**
   * Normalize promo code (strip whitespace, convert to uppercase)
   */
  normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  /**
   * Validate a promo code against a specific plan, billing cycle, and business context
   */
  async validatePromotion(params: {
    code: string;
    planId: string;
    billingPeriod: BillingPeriod;
    businessId?: string;
    addonsSubtotal?: number;
  }): Promise<PromotionValidationResult> {
    const { code, planId, billingPeriod, businessId } = params;
    const addonsSubtotal = Number(params.addonsSubtotal || 0);

    const normalizedCode = this.normalizeCode(code);
    if (!normalizedCode) {
      throw new BadRequestException('Promotion code cannot be empty');
    }

    // 1. Fetch promo code with coupon
    const promo = await this.promoCodeRepository.findOne({
      where: { code: normalizedCode },
      relations: ['coupon'],
    });

    if (!promo) {
      throw new NotFoundException(
        `Promotion code '${normalizedCode}' not found`,
      );
    }

    const coupon = promo.coupon;
    if (!coupon) {
      throw new NotFoundException('Associated coupon configuration not found');
    }

    // 2. Check active switches
    if (!promo.isActive) {
      throw new BadRequestException('This promotion code is currently suspended');
    }
    if (!coupon.isActive) {
      throw new BadRequestException(
        'The promotion campaign for this code is currently inactive',
      );
    }

    // 3. Date validity checks
    const now = new Date();
    if (promo.startsAt && now < new Date(promo.startsAt)) {
      throw new BadRequestException(
        `This promotion code is not active yet. Starts at ${new Date(promo.startsAt).toISOString()}`,
      );
    }
    if (promo.expiresAt && now > new Date(promo.expiresAt)) {
      throw new BadRequestException('This promotion code has expired');
    }

    // 4. Global redemption capacity
    if (
      promo.maxRedemptions !== null &&
      promo.maxRedemptions !== undefined &&
      promo.timesRedeemed >= promo.maxRedemptions
    ) {
      throw new BadRequestException(
        'This promotion code has reached its maximum redemptions limit',
      );
    }

    // 5. Fetch Plan
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // 6. Plan restrictions
    if (
      coupon.applicablePlanIds &&
      coupon.applicablePlanIds.length > 0 &&
      !coupon.applicablePlanIds.includes(planId)
    ) {
      throw new BadRequestException(
        `This coupon cannot be used for the ${plan.name} plan`,
      );
    }

    // 7. Billing period restrictions
    if (
      coupon.applicableBillingPeriods &&
      coupon.applicableBillingPeriods.length > 0 &&
      !coupon.applicableBillingPeriods.includes(billingPeriod)
    ) {
      throw new BadRequestException(
        `This coupon is not valid for ${billingPeriod} subscriptions`,
      );
    }

    // 8. Business-specific eligibility & per-user limits
    if (businessId) {
      // Check allowed business IDs whitelist
      if (
        promo.allowedBusinessIds &&
        promo.allowedBusinessIds.length > 0 &&
        !promo.allowedBusinessIds.includes(businessId)
      ) {
        throw new BadRequestException(
          'This promotion code is not eligible for your business account',
        );
      }

      // Check first-time subscriber restriction
      if (promo.firstTimeOnly) {
        const priorSubscriptionCount = await this.subscriptionRepository.count({
          where: { businessId },
        });
        if (priorSubscriptionCount > 0) {
          throw new BadRequestException(
            'This promotion code is exclusively for first-time subscribers',
          );
        }
      }

      // Check per-user redemption limit
      const userRedemptionCount = await this.redemptionRepository.count({
        where: {
          promotionCodeId: promo.id,
          businessId,
        },
      });

      const maxPerUser = promo.maxRedemptionsPerUser || 1;
      if (userRedemptionCount >= maxPerUser) {
        throw new BadRequestException(
          `You have already reached the maximum usage limit (${maxPerUser} time${maxPerUser > 1 ? 's' : ''}) for this promotion code`,
        );
      }
    }

    // 9. Calculate Base Price for selected cycle
    let originalPlanPrice = Number(plan.monthlyPrice || 0);
    if (billingPeriod === BillingPeriod.QUARTERLY) {
      originalPlanPrice = Number(plan.quarterlyPrice || 0);
    } else if (billingPeriod === BillingPeriod.YEARLY) {
      originalPlanPrice = Number(plan.yearlyPrice || 0);
    }

    // 10. Check minimum spend / subtotal requirement
    if (coupon.minSubtotal && originalPlanPrice < Number(coupon.minSubtotal)) {
      throw new BadRequestException(
        `A minimum subscription amount of ${coupon.currency || 'NGN'} ${coupon.minSubtotal} is required to use this coupon`,
      );
    }

    // 11. Calculate Discount
    let discountAmount = 0;
    const couponAmount = Number(coupon.amount || 0);

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (originalPlanPrice * couponAmount) / 100;
      if (
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined
      ) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maxDiscountAmount),
        );
      }
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(originalPlanPrice, couponAmount);
    }

    // Round discount to 2 decimals
    discountAmount = Math.round(discountAmount * 100) / 100;
    const discountedPlanPrice = Math.max(0, originalPlanPrice - discountAmount);

    // 12. Net Subtotal & Tax Calculation
    const netSubtotal = discountedPlanPrice + addonsSubtotal;
    const activeTaxConfig = await this.subscriptionTaxService.getActiveConfig();
    const taxResult = this.subscriptionTaxService.calculateTax(
      netSubtotal,
      activeTaxConfig,
    );

    return {
      isValid: true,
      coupon,
      promotionCode: promo,
      originalPlanPrice,
      discountAmount,
      discountedPlanPrice,
      addonsSubtotal,
      netSubtotal,
      taxAmount: taxResult.taxAmount,
      total: taxResult.total,
      taxRule: taxResult.taxRule,
    };
  }

  /**
   * Atomically record a redemption and increment timesRedeemed counter
   */
  async recordRedemption(params: {
    promotionCodeId: string;
    couponId: string;
    businessId: string;
    userId: string;
    subscriptionId?: string;
    paymentReference: string;
    planId: string;
    billingPeriod: BillingPeriod;
    originalAmount: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
    currency?: string;
  }): Promise<CouponRedemption> {
    // 1. Atomically increment timesRedeemed on promotion code with concurrency guard
    const updateResult = await this.promoCodeRepository
      .createQueryBuilder()
      .update(PromotionCode)
      .set({ timesRedeemed: () => 'times_redeemed + 1' })
      .where('id = :id AND (maxRedemptions IS NULL OR times_redeemed < maxRedemptions)', {
        id: params.promotionCodeId,
      })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        'Promotion code has reached its maximum allowed redemptions limit during checkout.',
      );
    }

    // 2. Create and persist redemption log
    const redemption = this.redemptionRepository.create({
      promotionCodeId: params.promotionCodeId,
      couponId: params.couponId,
      businessId: params.businessId,
      userId: params.userId,
      subscriptionId: params.subscriptionId || null,
      paymentReference: params.paymentReference,
      planId: params.planId,
      billingPeriod: params.billingPeriod,
      originalAmount: params.originalAmount,
      discountAmount: params.discountAmount,
      taxAmount: params.taxAmount,
      finalAmount: params.finalAmount,
      currency: params.currency || 'NGN',
    });

    const saved = await this.redemptionRepository.save(redemption);
    this.logger.log(
      `Recorded coupon redemption ${saved.id} for promo ${params.promotionCodeId} by business ${params.businessId} (Ref: ${params.paymentReference})`,
    );

    return saved;
  }
}
