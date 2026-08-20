import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { PlansService } from './plans.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Business } from '../businesses/entities/business.entity';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  PaymentsService,
  VerifiedTransaction,
} from '../payments/payments.service';
import { Device } from '../devices/entities/device.entity';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import {
  SubscriptionCapabilities,
  AddOnCapabilityInfo,
} from './types/capabilities';
import { CreditService } from '../messaging/services/credit.service';
import { CatalogueCategory } from '../catalogue/entities/catalogue-category.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { AutomationRule } from '../messaging/entities/automation-rule.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { AffiliateSyncService } from '../affiliates/affiliate-sync.service';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { AddonsService } from './services/addons.service';
import { AddOn } from './entities/addon.entity';
import {
  SubscriptionTaxService,
  TaxCalculationResult,
} from './services/subscription-tax.service';
import { PricePreviewDto } from './dto/tax/price-preview.dto';
import {
  CouponEngineService,
  PromotionValidationResult,
} from '../coupons/services/coupon-engine.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(CatalogueCategory)
    private readonly catalogueCategoryRepository: Repository<CatalogueCategory>,
    @InjectRepository(CatalogueItem)
    private readonly catalogueItemRepository: Repository<CatalogueItem>,
    @InjectRepository(CatalogueOffer)
    private readonly catalogueOfferRepository: Repository<CatalogueOffer>,
    @InjectRepository(AutomationRule)
    private readonly automationRuleRepository: Repository<AutomationRule>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
    private readonly creditService: CreditService,
    private readonly affiliatesService: AffiliatesService,
    private readonly affiliateSyncService: AffiliateSyncService,
    @Inject(forwardRef(() => QrThriveService))
    private readonly qrThriveService: QrThriveService,
    private readonly addonsService: AddonsService,
    private readonly subscriptionTaxService: SubscriptionTaxService,
    @Inject(forwardRef(() => CouponEngineService))
    private readonly couponEngineService: CouponEngineService,
    private readonly mailService: MailService,
  ) {}

  async activeSubscription(
    businessId?: string,
    autoAssignFree = true,
  ): Promise<Subscription | null> {
    if (!businessId) return null;
    let sub = await this.subscriptionRepository.findOne({
      where: {
        businessId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan'],
      order: {
        createdAt: 'DESC',
      },
    });

    if (sub && sub.endDate < new Date()) {
      const now = new Date();
      const gracePeriod = new Date(sub.endDate);
      gracePeriod.setHours(gracePeriod.getHours() + 24);

      if (now > gracePeriod) {
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
        sub = null;
      }
    }

    if (!sub && autoAssignFree) {
      // Find latest subscription record to check past history
      const lastSub = await this.subscriptionRepository.findOne({
        where: { businessId },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      // If business has NEVER had a subscription, OR their last subscription is EXPIRED:
      // Auto-assign to Free plan and send email
      if (!lastSub || lastSub.status === SubscriptionStatus.EXPIRED) {
        try {
          const isExpiredDowngrade = lastSub?.status === SubscriptionStatus.EXPIRED;
          const freeSubResult = await this.subscribeToFreePlan(
            businessId,
            isExpiredDowngrade,
          );
          if (freeSubResult?.subscription) {
            return this.subscriptionRepository.findOne({
              where: { id: freeSubResult.subscription.id },
              relations: ['plan'],
            });
          }
        } catch (err: any) {
          this.logger.error(
            `Failed to auto-assign free plan in activeSubscription for ${businessId}: ${err?.message}`,
          );
        }
      }
    }

    return sub;
  }

  async subscribeToFreePlan(
    businessId: string,
    isExpiredDowngrade = false,
  ): Promise<{ subscription: Subscription; addOns?: any[] } | null> {
    const freePlan = await this.plansService.findFreePlan();
    if (!freePlan) {
      this.logger.warn(
        `No active free plan found to auto-subscribe business ${businessId}`,
      );
      return null;
    }

    return this.subscribe({
      planId: freePlan.id,
      businessId,
      billingPeriod: BillingPeriod.YEARLY, // Default for free plan
      isExpiredDowngrade,
    } as any);
  }

  async cancelSubscription(
    businessId: string,
  ): Promise<{ message: string; subscription: Subscription }> {
    const sub = await this.subscriptionRepository.findOne({
      where: {
        businessId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan'],
    });

    if (!sub) {
      throw new NotFoundException(
        'No active or trial subscription found for this business',
      );
    }

    sub.status = SubscriptionStatus.CANCELED;
    const updatedSub = await this.subscriptionRepository.save(sub);

    this.logger.log(
      `Subscription ${sub.id} for business ${businessId} has been cancelled`,
    );

    return {
      message: 'Subscription cancelled successfully',
      subscription: updatedSub,
    };
  }

  async subscribe(
    subscribeDto: SubscribeDto & {
      addonIds?: string[];
      addonQuantities?: number[];
    },
  ): Promise<{ subscription: Subscription; addOns?: any[] }> {
    const {
      planId,
      businessId,
      billingPeriod,
      paymentReference,
      isTrial = false,
      isAdminOverride = false,
      addonIds,
      addonQuantities,
    } = subscribeDto;

    const plan = await this.plansService.findOne(planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not active');
    }

    if (!plan.isFree && !plan.permissionsConfiguredAt && !isAdminOverride) {
      throw new BadRequestException(
        'This plan is not yet available for subscription. Permissions must be configured first.',
      );
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['owner'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let addons: AddOn[] = [];
    if (addonIds && addonIds.length > 0) {
      addons = await this.addonsService.validateAddons(addonIds);
    }

    let status = SubscriptionStatus.ACTIVE;
    let trialEndDate: Date | null = null;
    const startDate = new Date();
    let endDate = new Date(startDate);
    let authCode: string | null = null;
    let paymentData: VerifiedTransaction | null = null;

    if (paymentReference) {
      paymentData =
        await this.paymentsService.verifyTransaction(paymentReference);
      if (!paymentData || paymentData.status !== 'success') {
        if (paymentData?.status === 'pending') {
          throw new BadRequestException(
            'Payment is still being processed. Please check back shortly.',
          );
        }
        throw new BadRequestException('Payment verification failed');
      }
      authCode = paymentData.authorization?.authorization_code ?? null;

      // Idempotency: if this reference already produced a subscription (e.g.
      // the webhook processed it before the client callback arrived), return
      // the existing subscription instead of creating a duplicate.
      const existingByRef = await this.subscriptionRepository.findOne({
        where: { paystackReference: paymentReference },
        relations: ['plan'],
      });
      if (existingByRef) {
        return { subscription: existingByRef, addOns: [] };
      }
    }

    if (plan.isFree) {
      endDate.setFullYear(endDate.getFullYear() + 10);
      status = SubscriptionStatus.ACTIVE;
    } else {
      const trialDays = plan.trialDurationDays || 0;

      if (isTrial) {
        if (trialDays <= 0) {
          throw new BadRequestException(
            'This plan does not offer a trial period.',
          );
        }
        if (paymentData && paymentData.amount !== 10000) {
          throw new BadRequestException(
            'Payment amount does not match the ₦100 verification deposit.',
          );
        }
        if (paymentReference) {
          // Record the ₦100 verification deposit so the pending intent created
          // at initialize-payment is upgraded to Success (data consistency).
          await this.paymentsService.recordPayment({
            reference: paymentReference,
            amount: 100,
            purpose: PaymentPurpose.SUBSCRIPTION,
            status: PaymentStatus.SUCCESS,
            metadata: { planId, billingPeriod, isTrial: true },
            businessId,
            userId: business.ownerId,
          });
        }
        status = SubscriptionStatus.TRIAL;
        const trialEnd = new Date(startDate);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        trialEndDate = trialEnd;
        endDate = trialEnd;
      } else {
        if (!paymentReference && !isAdminOverride) {
          throw new BadRequestException(
            'Payment reference is required for direct subscription',
          );
        }

        if (paymentReference) {
          // Calculate total price: Plan price (for cycle) + Add-ons
          let planPrice = Number(plan.monthlyPrice || 0);
          if (billingPeriod === BillingPeriod.QUARTERLY)
            planPrice = Number(plan.quarterlyPrice || 0);
          else if (billingPeriod === BillingPeriod.YEARLY)
            planPrice = Number(plan.yearlyPrice || 0);

          const addonsTotal = addons.reduce((sum, addon, index) => {
            const qty = addonQuantities?.[index] ?? 1;
            return sum + Number(addon.price) * qty;
          }, 0);

          let promoValidation: PromotionValidationResult | null = null;
          let subtotal: number;
          let taxAmount: number;
          let totalAmount: number;
          let taxMetadata: any = {};

          if (subscribeDto.promoCode) {
            promoValidation = await this.couponEngineService.validatePromotion({
              code: subscribeDto.promoCode,
              planId,
              billingPeriod,
              businessId,
              addonsSubtotal: addonsTotal,
            });

            subtotal = promoValidation.netSubtotal;
            taxAmount = promoValidation.taxAmount;
            totalAmount = promoValidation.total;
            taxMetadata = {
              taxAmount,
              taxRate: promoValidation.taxRule.rate,
              taxType: promoValidation.taxRule.taxType,
              taxName: promoValidation.taxRule.name,
              taxEnabled: promoValidation.taxRule.isEnabled,
              discountAmount: promoValidation.discountAmount,
              promoCode: promoValidation.promotionCode.code,
              couponId: promoValidation.coupon.id,
              couponName: promoValidation.coupon.name,
            };
          } else {
            subtotal = planPrice + addonsTotal;
            const taxConfig =
              await this.subscriptionTaxService.getActiveConfig();
            const taxResult = this.subscriptionTaxService.calculateTax(
              subtotal,
              taxConfig,
            );
            taxAmount = taxResult.taxAmount;
            totalAmount = taxResult.total;
            taxMetadata = {
              taxAmount: taxResult.taxAmount,
              taxRate: taxResult.taxRule.rate,
              taxType: taxResult.taxRule.taxType,
              taxName: taxResult.taxRule.name,
              taxEnabled: taxResult.taxRule.isEnabled,
            };
          }

          if (paymentData && Math.round(totalAmount * 100) !== paymentData.amount) {
            throw new BadRequestException(
              'Payment amount does not match the selected plan total.',
            );
          }

          await this.paymentsService.recordPayment({
            reference: paymentReference,
            amount: totalAmount,
            purpose:
              addons.length > 0
                ? PaymentPurpose.PLAN_WITH_ADDONS
                : PaymentPurpose.SUBSCRIPTION,
            status: PaymentStatus.SUCCESS,
            metadata: {
              planId,
              billingPeriod,
              addonIds,
              addonQuantities,
              subtotal,
              total: totalAmount,
              ...taxMetadata,
            },
            businessId,
            userId: business.ownerId,
          });

          await this.reportCommission(
            business,
            plan,
            paymentReference,
            subtotal,
          );

          (this as any)._lastPromoValidation = promoValidation;
        }


        if (billingPeriod === BillingPeriod.MONTHLY)
          endDate.setMonth(endDate.getMonth() + 1);
        else if (billingPeriod === BillingPeriod.QUARTERLY)
          endDate.setMonth(endDate.getMonth() + 3);
        else if (billingPeriod === BillingPeriod.YEARLY)
          endDate.setFullYear(endDate.getFullYear() + 1);
      }
    }

    if (isAdminOverride && subscribeDto.customEndDate) {
      const parsedDate = new Date(subscribeDto.customEndDate);
      if (!isNaN(parsedDate.getTime())) {
        endDate = parsedDate;
      }
    }

    const activeSub = await this.activeSubscription(businessId, false);
    let previousPlanName = activeSub?.plan?.name;
    if (activeSub) {
      activeSub.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepository.save(activeSub);
    } else {
      const lastSub = await this.subscriptionRepository.findOne({
        where: { businessId },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });
      if (lastSub?.plan?.name) {
        previousPlanName = lastSub.plan.name;
      }
    }

    const newSub = this.subscriptionRepository.create({
      businessId,
      planId,
      billingPeriod,
      startDate,
      endDate,
      trialEndDate,
      status,
      paystackReference: paymentReference,
      paystackAuthorizationCode: authCode,
    });

    const savedSub = await this.subscriptionRepository.save(newSub);

    // Record coupon redemption if promo code was used
    const promoValidation: PromotionValidationResult | null = (this as any)._lastPromoValidation;
    delete (this as any)._lastPromoValidation;

    if (promoValidation && paymentReference) {
      try {
        await this.couponEngineService.recordRedemption({
          promotionCodeId: promoValidation.promotionCode.id,
          couponId: promoValidation.coupon.id,
          businessId: business.id,
          userId: business.ownerId,
          subscriptionId: savedSub.id,
          paymentReference,
          planId,
          billingPeriod,
          originalAmount: promoValidation.originalPlanPrice,
          discountAmount: promoValidation.discountAmount,
          taxAmount: promoValidation.taxAmount,
          finalAmount: promoValidation.total,
          currency: plan.currency || 'NGN',
        });
      } catch (err) {
        this.logger.error(
          `Failed to record coupon redemption for subscription ${savedSub.id}: ${err.message}`,
          err.stack,
        );
      }
    }

    let purchasedAddOns: any[] = [];
    if (
      (status === SubscriptionStatus.ACTIVE ||
        status === SubscriptionStatus.TRIAL) &&
      addons.length > 0
    ) {
      purchasedAddOns = await this.addonsService.purchasePlanWithAddons(
        addons,
        addonQuantities,
        business.id,
        business.ownerId,
        paymentReference as string,
        paymentData,
      );
    }

    if (
      status === SubscriptionStatus.ACTIVE ||
      status === SubscriptionStatus.TRIAL
    ) {
      const branches = await this.branchRepository.find({
        where: { businessId },
      });
      const branchIds = branches.map((b) => b.id);
      if (branchIds.length > 0) {
        await this.userRepository.update(
          { branchId: In(branchIds) },
          { status: UserStatus.ACTIVE },
        );
      }
      await this.userRepository.update(
        { id: business.ownerId },
        { status: UserStatus.ACTIVE },
      );

      await this.creditService.allocateSubscriptionCredits(business.id, plan);

      await this.syncUserSubscriptionToQrThrive(business.id);

      // Send plan change notification email asynchronously
      try {
        let owner: User | null = business.owner;
        if (!owner && business.ownerId) {
          owner = await this.userRepository.findOne({
            where: { id: business.ownerId },
          });
        }

        if (owner?.email) {
          const customerName =
            `${owner.firstName || ''} ${owner.lastName || ''}`.trim() ||
            'Valued Customer';
          const isExpiredDowngrade = Boolean(
            (subscribeDto as any)?.isExpiredDowngrade ||
            (previousPlanName && plan.isFree && !isTrial && !isAdminOverride),
          );

          this.mailService
            .sendPlanChangeEmail({
              email: owner.email,
              customerName,
              businessName: business.name,
              planName: plan.name,
              billingPeriod,
              startDate,
              endDate,
              isTrial,
              isAdminOverride,
              isExpiredDowngrade,
              previousPlanName,
              features: plan.features || [],
              credits: {
                sms: plan.smsCredits,
                email: plan.emailCredits,
                whatsapp: plan.whatsappCredits,
              },
              limits: {
                branches: plan.branchLimit,
                teamMembers: plan.teamMembersLimit,
                catalogueItems: plan.maxCatalogueItems,
              },
            })
            .catch((err) => {
              this.logger.error(
                `Failed to send plan change email to ${owner?.email}: ${err.message}`,
              );
            });
        }
      } catch (emailErr) {
        this.logger.error(
          `Error triggering plan change email for business ${businessId}: ${emailErr.message}`,
        );
      }
    }

    return { subscription: savedSub, addOns: purchasedAddOns };
  }

  /**
   * Server-side payment initialization for subscription checkout. Computes the
   * exact amount (plan price + tax, or the ₦100 trial deposit), creates a
   * pending payment record (used to map the reference back to a business/plan
   * when the webhook fires), and returns the Paystack access_code so the
   * frontend can complete payment without ever holding the secret key.
   */
  async initializePayment(input: {
    planId: string;
    businessId: string;
    billingPeriod: BillingPeriod;
    isTrial?: boolean;
    promoCode?: string;
    addonIds?: string[];
    addonQuantities?: number[];
  }): Promise<{
    reference: string;
    access_code: string;
    authorization_url: string;
    amount: number;
  }> {
    const {
      planId,
      businessId,
      billingPeriod,
      isTrial = false,
      promoCode,
      addonIds,
      addonQuantities,
    } = input;

    const plan = await this.plansService.findOne(planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not active');
    }

    let addons: AddOn[] = [];
    if (addonIds && addonIds.length > 0) {
      addons = await this.addonsService.validateAddons(addonIds);
    }

    const addonsTotal = addons.reduce((sum, addon, index) => {
      const qty = addonQuantities?.[index] ?? 1;
      return sum + Number(addon.price) * qty;
    }, 0);

    let amount: number;
    let paymentMetadata: any = {};

    if (plan.isFree) {
      amount = 0;
    } else if (isTrial) {
      amount = 100;
      paymentMetadata = { isTrial: true };
    } else {
      let planPrice = Number(plan.monthlyPrice || 0);
      if (billingPeriod === BillingPeriod.QUARTERLY)
        planPrice = Number(plan.quarterlyPrice || 0);
      else if (billingPeriod === BillingPeriod.YEARLY)
        planPrice = Number(plan.yearlyPrice || 0);

      const cleanPromo = promoCode?.trim();
      if (cleanPromo) {
        const promoValidation =
          await this.couponEngineService.validatePromotion({
            code: cleanPromo,
            planId,
            billingPeriod,
            businessId,
            addonsSubtotal: addonsTotal,
          });

        amount = promoValidation.total;
        paymentMetadata = {
          subtotal: promoValidation.netSubtotal,
          taxAmount: promoValidation.taxAmount,
          taxRate: promoValidation.taxRule?.rate,
          taxType: promoValidation.taxRule?.taxType,
          taxName: promoValidation.taxRule?.name,
          taxEnabled: promoValidation.taxRule?.isEnabled,
          discountAmount: promoValidation.discountAmount,
          promoCode: promoValidation.promotionCode.code,
          couponId: promoValidation.coupon.id,
          couponName: promoValidation.coupon.name,
          originalPlanPrice: promoValidation.originalPlanPrice,
          discountedPlanPrice: promoValidation.discountedPlanPrice,
        };
      } else {
        const subtotal = planPrice + addonsTotal;
        const taxConfig = await this.subscriptionTaxService.getActiveConfig();
        const taxResult = this.subscriptionTaxService.calculateTax(
          subtotal,
          taxConfig,
        );
        amount = taxResult.total;
        paymentMetadata = {
          subtotal,
          taxAmount: taxResult.taxAmount,
          taxRate: taxResult.taxRule.rate,
          taxType: taxResult.taxRule.taxType,
          taxName: taxResult.taxRule.name,
          taxEnabled: taxResult.taxRule.isEnabled,
        };
      }
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['owner'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const email = business.officialEmail || business.owner?.email;
    if (!email) {
      throw new BadRequestException(
        'Business owner email is required to initialize payment',
      );
    }

    const reference = `SUB-${businessId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const normalizedPromo = promoCode?.trim().toUpperCase();

    const init = await this.paymentsService.initializeTransaction({
      email,
      amount: Math.round(amount * 100),
      reference,
      currency: plan.currency || 'NGN',
      metadata: {
        businessId,
        planId,
        billingPeriod,
        isTrial,
        addonIds,
        addonQuantities,
        promoCode: normalizedPromo,
        purpose:
          addons.length > 0
            ? PaymentPurpose.PLAN_WITH_ADDONS
            : PaymentPurpose.SUBSCRIPTION,
        ...paymentMetadata,
      },
    });
    if (!init) {
      throw new BadRequestException(
        'Failed to initialize payment with Paystack',
      );
    }

    await this.paymentsService.recordPayment({
      reference,
      amount,
      purpose:
        addons.length > 0
          ? PaymentPurpose.PLAN_WITH_ADDONS
          : PaymentPurpose.SUBSCRIPTION,
      status: PaymentStatus.PENDING,
      metadata: {
        businessId,
        planId,
        billingPeriod,
        isTrial,
        addonIds,
        addonQuantities,
        promoCode: normalizedPromo,
        total: amount,
        ...paymentMetadata,
      },
      businessId,
      userId: business.ownerId,
    });

    return {
      reference,
      access_code: init.access_code,
      authorization_url: init.authorization_url,
      amount,
    };
  }

  async getSubscriptionStatus(
    businessId: string,
  ): Promise<SubscriptionStatus | null> {
    const active = await this.activeSubscription(businessId);
    if (active) return active.status;

    const lastSub = await this.subscriptionRepository.findOne({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });

    if (lastSub) {
      return lastSub.status;
    }

    return null;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processDailySubscriptions() {
    this.logger.log('Running automated subscription processing...');
    await this.processExpiredTrials();
    await this.processRenewals();
  }

  async processExpiredTrials() {
    const now = new Date();
    const expiredTrials = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        endDate: LessThanOrEqual(now),
      },
      relations: ['plan', 'business', 'business.owner'],
    });

    this.logger.log(`Found ${expiredTrials.length} expired trials to process.`);

    for (const sub of expiredTrials) {
      if (!sub.paystackAuthorizationCode) {
        this.logger.warn(
          `Subscription ${sub.id} has no auth code. Expiring...`,
        );
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
        continue;
      }

      let amount = sub.plan.monthlyPrice;
      if (sub.billingPeriod === BillingPeriod.QUARTERLY)
        amount = sub.plan.quarterlyPrice;
      if (sub.billingPeriod === BillingPeriod.YEARLY)
        amount = sub.plan.yearlyPrice;

      if (amount <= 0) {
        await this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);
        continue;
      }

      const ownerEmail =
        sub.business?.officialEmail ||
        sub.business?.owner?.email ||
        'billing@latap.com';

      const taxConfig =
        await this.subscriptionTaxService.getActiveConfig();
      const taxResult = this.subscriptionTaxService.calculateTax(
        amount,
        taxConfig,
      );
      const chargeAmount = taxResult.total;

      const charge: any = await this.paymentsService.chargeAuthorization(
        chargeAmount,
        ownerEmail,
        sub.paystackAuthorizationCode,
      );

      if (charge && charge.status === 'success') {
        this.logger.log(
          `Successfully charged subscription ${sub.id}. Upgrading to ACTIVE.`,
        );

        await this.paymentsService.recordPayment({
          reference: charge.reference,
          amount: chargeAmount,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: {
            subscriptionId: sub.id,
            planId: sub.planId,
            subtotal: taxResult.subtotal,
            taxAmount: taxResult.taxAmount,
            taxRate: taxResult.taxRule.rate,
            taxType: taxResult.taxRule.taxType,
            taxName: taxResult.taxRule.name,
            taxEnabled: taxResult.taxRule.isEnabled,
            total: chargeAmount,
          },
          businessId: sub.businessId,
          userId: sub.business?.ownerId,
        });

        await this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);

        // Trigger affiliate commission (on base amount)
        if (sub.business) {
          await this.reportCommission(
            sub.business,
            sub.plan,
            charge.reference,
            amount,
          );
        }

        if (sub.businessId) {
          const branches = await this.branchRepository.find({
            where: { businessId: sub.businessId },
          });
          const branchIds = branches.map((b) => b.id);
          if (branchIds.length > 0) {
            await this.userRepository.update(
              { branchId: In(branchIds) },
              { status: UserStatus.ACTIVE },
            );
          }
        }
      } else {
        this.logger.error(`Failed to charge subscription ${sub.id}. Expiring.`);
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
      }
    }
  }

  async processRenewals() {
    const now = new Date();
    const expiringSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(now),
      },
      relations: ['plan', 'business', 'business.owner'],
    });

    this.logger.log(
      `Found ${expiringSubscriptions.length} active subscriptions to renew.`,
    );

    for (const sub of expiringSubscriptions) {
      if (!sub.paystackAuthorizationCode) {
        this.logger.warn(
          `Subscription ${sub.id} has no auth code for renewal. Expiring...`,
        );
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
        continue;
      }

      let amount = sub.plan.monthlyPrice;
      if (sub.billingPeriod === BillingPeriod.QUARTERLY)
        amount = sub.plan.quarterlyPrice;
      if (sub.billingPeriod === BillingPeriod.YEARLY)
        amount = sub.plan.yearlyPrice;

      if (amount <= 0) {
        await this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);
        continue;
      }

      const ownerEmail =
        sub.business?.officialEmail ||
        sub.business?.owner?.email ||
        'billing@latap.com';

      const taxConfig =
        await this.subscriptionTaxService.getActiveConfig();
      const taxResult = this.subscriptionTaxService.calculateTax(
        amount,
        taxConfig,
      );
      const chargeAmount = taxResult.total;

      const charge: any = await this.paymentsService.chargeAuthorization(
        chargeAmount,
        ownerEmail,
        sub.paystackAuthorizationCode,
      );

      if (charge && charge.status === 'success') {
        this.logger.log(
          `Successfully renewed subscription ${sub.id}. Upgrading end date.`,
        );

        await this.paymentsService.recordPayment({
          reference: charge.reference,
          amount: chargeAmount,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: {
            subscriptionId: sub.id,
            planId: sub.planId,
            renewal: true,
            subtotal: taxResult.subtotal,
            taxAmount: taxResult.taxAmount,
            taxRate: taxResult.taxRule.rate,
            taxType: taxResult.taxRule.taxType,
            taxName: taxResult.taxRule.name,
            taxEnabled: taxResult.taxRule.isEnabled,
            total: chargeAmount,
          },
          businessId: sub.businessId,
          userId: sub.business?.ownerId,
        });

        // Trigger affiliate commission
        if (sub.business) {
          await this.reportCommission(
            sub.business,
            sub.plan,
            charge.reference,
            amount,
          );
        }

        await this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);
      } else {
        this.logger.error(`Failed to renew subscription ${sub.id}. Expiring.`);
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
      }
    }
  }

  private async activateSubscription(sub: Subscription) {
    sub.status = SubscriptionStatus.ACTIVE;
    const now = new Date();
    sub.startDate = now;
    sub.endDate = new Date(now);

    if (sub.billingPeriod === BillingPeriod.MONTHLY)
      sub.endDate.setMonth(sub.endDate.getMonth() + 1);
    else if (sub.billingPeriod === BillingPeriod.QUARTERLY)
      sub.endDate.setMonth(sub.endDate.getMonth() + 3);
    else if (sub.billingPeriod === BillingPeriod.YEARLY)
      sub.endDate.setFullYear(sub.endDate.getFullYear() + 1);

    if (sub.businessId && sub.plan) {
      await this.creditService.allocateSubscriptionCredits(
        sub.businessId,
        sub.plan,
      );

      // Sync with QR-Thrive
      await this.syncUserSubscriptionToQrThrive(sub.businessId);
    }
  }

  private async retrySyncToQrThrive(
    businessId: string,
    owner: User,
    qrThrivePlanId: string,
    maxRetries: number = 3,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.qrThriveService.syncSubscription(owner, qrThrivePlanId);
        return;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        this.logger.warn(
          `QR-Thrive sync attempt ${attempt}/${maxRetries} failed for business ${businessId}: ${error.message}${isLastAttempt ? '. No more retries.' : `, retrying in ${delayMs}ms...`}`,
        );
        if (isLastAttempt) {
          this.logger.error(
            `Failed to sync subscription to QR-Thrive for business ${businessId} after ${maxRetries} attempts`,
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Syncs the current effective subscription plan to QR-Thrive.
   * Fallbacks to the free plan if no active subscription exists.
   * Retries with exponential backoff on failure (max 3 attempts).
   */
  async syncUserSubscriptionToQrThrive(businessId: string) {
    if (!this.qrThriveService?.isQrThriveEnabled) {
      return;
    }
    try {
      const business = await this.businessRepository.findOne({
        where: { id: businessId },
        relations: ['owner'],
      });
      if (!business) return;

      const activeSub = await this.activeSubscription(businessId);
      let qrThrivePlanId = activeSub?.plan?.qrThrivePlanId;

      // If no active paid plan mapped, try to find the default free plan mapping
      if (!qrThrivePlanId) {
        const freePlan = await this.plansService.findFreePlan();
        qrThrivePlanId = freePlan?.qrThrivePlanId;
      }

      if (qrThrivePlanId && business.owner) {
        await this.retrySyncToQrThrive(
          businessId,
          business.owner,
          qrThrivePlanId,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve business/owner for QR-Thrive sync for business ${businessId}: ${error.message}`,
      );
    }
  }

  async getCapabilities(businessId: string): Promise<SubscriptionCapabilities> {
    const sub = await this.activeSubscription(businessId);

    let plan = sub?.plan;
    if (!plan) {
      const plans = await this.plansService.findAll(true);
      plan = plans.find((p) => p.isFree);
    }

    if (!plan) {
      throw new BadRequestException(
        'No active plan and no default free plan available',
      );
    }

    const branches = await this.branchRepository.find({
      where: { businessId },
    });
    const branchIds = branches.map((b) => b.id);

    const usedStaff = await this.userRepository.count({
      where: {
        branchId: In(branchIds),
        role: In([UserRole.MANAGER, UserRole.STAFF]),
      },
    });
    const usedTags = await this.deviceRepository.count({
      where: { branchId: In(branchIds) },
    });
    const usedBranches = branches.filter((b) => !b.isMainBranch).length;

    const usedCatalogueItems = await this.catalogueItemRepository.count({
      where: { businessId },
    });
    const usedCatalogueCategories =
      await this.catalogueCategoryRepository.count({
        where: { businessId },
      });
    const usedCatalogueOffers = await this.catalogueOfferRepository.count({
      where: { businessId },
    });

    const usedAutomations = await this.automationRuleRepository.count({
      where: { businessId },
    });

    const usedLoyaltyPrograms = await this.rewardRepository.count({
      where: { businessId },
    });

    const addonCapabilities =
      await this.addonsService.getAddonCapabilities(businessId);
    const activeBusinessAddOns =
      await this.addonsService.getActiveBusinessAddons(businessId);

    const addOnsInfo: AddOnCapabilityInfo[] = activeBusinessAddOns.map(
      (ba) => ({
        id: ba.addon.id,
        name: ba.addon.name,
        type: ba.addon.type,
        targetCapability:
          ba.metadata?.targetCapability ??
          ba.addon.targetCapability ??
          undefined,
        additionalLimit:
          ba.metadata?.additionalLimit ?? ba.addon.additionalLimit ?? 0,
        expiresAt: ba.expiresAt,
        quantity: ba.quantity,
      }),
    );

    const addonBranches =
      addonCapabilities['branches'] || addonCapabilities['branchLimit'] || 0;
    const addonTeamMembers =
      addonCapabilities['teamMembers'] ||
      addonCapabilities['teamMembersLimit'] ||
      0;
    const addonAutomations =
      addonCapabilities['automations'] ||
      addonCapabilities['automationsLimit'] ||
      0;
    const addonCatalogueItems =
      addonCapabilities['catalogueItems'] ||
      addonCapabilities['maxCatalogueItems'] ||
      0;
    const addonCatalogueCategories =
      addonCapabilities['catalogueCategories'] ||
      addonCapabilities['maxCatalogueCategories'] ||
      0;
    const addonCatalogueOffers =
      addonCapabilities['catalogueOffers'] ||
      addonCapabilities['maxCatalogueOffers'] ||
      0;
    const addonLoyalty =
      addonCapabilities['loyalty'] ||
      addonCapabilities['loyaltyPrograms'] ||
      addonCapabilities['loyaltyLimit'] ||
      0;
    const addonAnalytics = addonCapabilities['analytics'] || 0;
    const addonMessaging = addonCapabilities['messaging'] || 0;

    const baseBranchLimit =
      plan.branchLimit === -1 ? 'unlimited' : (plan.branchLimit ?? 0);
    const finalBranchLimit =
      typeof baseBranchLimit === 'number'
        ? baseBranchLimit + addonBranches
        : baseBranchLimit;

    const baseTeamLimit =
      plan.teamMembersLimit === -1 ? 'unlimited' : (plan.teamMembersLimit ?? 0);
    const finalTeamLimit =
      typeof baseTeamLimit === 'number'
        ? baseTeamLimit + addonTeamMembers
        : baseTeamLimit;

    const baseAutomationsLimit =
      plan.maxAutomations === -1 ? 'unlimited' : (plan.maxAutomations ?? 0);
    const finalAutomationsLimit =
      typeof baseAutomationsLimit === 'number'
        ? baseAutomationsLimit + addonAutomations
        : baseAutomationsLimit;

    const baseCatalogueItemsLimit =
      plan.maxCatalogueItems === -1
        ? 'unlimited'
        : (plan.maxCatalogueItems ?? 0);
    const finalCatalogueItemsLimit =
      typeof baseCatalogueItemsLimit === 'number'
        ? baseCatalogueItemsLimit + addonCatalogueItems
        : baseCatalogueItemsLimit;

    const baseCatalogueCategoriesLimit =
      plan.maxCatalogueCategories === -1
        ? 'unlimited'
        : (plan.maxCatalogueCategories ?? 0);
    const finalCatalogueCategoriesLimit =
      typeof baseCatalogueCategoriesLimit === 'number'
        ? baseCatalogueCategoriesLimit + addonCatalogueCategories
        : baseCatalogueCategoriesLimit;

    // Offers are a capability of the catalogue. When the catalogue itself is
    // unlimited (maxCatalogueItems === -1) and no explicit offers limit has
    // been configured, treat offers as unlimited too. This prevents a stale /
    // defaulted maxCatalogueOffers (0 or null) from silently blocking deal
    // creation for plans whose catalogue is set to Unlimited.
    const catalogueIsUnlimited = plan.maxCatalogueItems === -1;
    const offersHasExplicitLimit =
      plan.maxCatalogueOffers != null && plan.maxCatalogueOffers > 0;
    const baseCatalogueOffersLimit =
      plan.maxCatalogueOffers === -1 ||
      (catalogueIsUnlimited && !offersHasExplicitLimit)
        ? 'unlimited'
        : (plan.maxCatalogueOffers ?? 0);
    const finalCatalogueOffersLimit =
      typeof baseCatalogueOffersLimit === 'number'
        ? baseCatalogueOffersLimit + addonCatalogueOffers
        : baseCatalogueOffersLimit;

    // Pre-calculate final enabled states to use consistently for remaining checks
    const teamMembersEnabled = plan.teamMembersEnabled || addonTeamMembers > 0;
    const loyaltyEnabled = plan.loyaltyEnabled || addonLoyalty > 0;
    const branchesEnabled = plan.branchesEnabled || addonBranches > 0;
    const automationsEnabled = plan.automationsEnabled || addonAutomations > 0;
    const catalogueEnabled =
      plan.catalogueEnabled ||
      addonCatalogueItems > 0 ||
      addonCatalogueCategories > 0 ||
      addonCatalogueOffers > 0;
    const analyticsEnabled = plan.analyticsEnabled || addonAnalytics > 0;
    const messagingEnabled = plan.messagingEnabled || addonMessaging > 0;

    return {
      plan: plan.name,
      isActive:
        sub?.status === SubscriptionStatus.ACTIVE ||
        sub?.status === SubscriptionStatus.TRIAL,
      isTrial: sub?.status === SubscriptionStatus.TRIAL,
      capabilities: {
        teamMembers: {
          enabled: teamMembersEnabled,
          limit: finalTeamLimit,
          used: usedStaff,
          remaining: !teamMembersEnabled
            ? 0
            : finalTeamLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(0, finalTeamLimit - usedStaff),
        },
        tags: {
          enabled: true,
          limit: 'unlimited',
          used: usedTags,
          remaining: 'unlimited',
        },
        loyaltyPrograms: {
          enabled: loyaltyEnabled,
          limit:
            plan.loyaltyLimit === -1 ? 'unlimited' : (plan.loyaltyLimit ?? 0),
          used: usedLoyaltyPrograms,
          remaining: !loyaltyEnabled
            ? 0
            : plan.loyaltyLimit === -1
              ? 'unlimited'
              : Math.max(0, (plan.loyaltyLimit ?? 0) - usedLoyaltyPrograms),
        },
        branches: {
          enabled: branchesEnabled,
          limit: finalBranchLimit,
          used: usedBranches,
          remaining: !branchesEnabled
            ? 0
            : finalBranchLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(0, finalBranchLimit - usedBranches),
        },
        automations: {
          enabled: automationsEnabled,
          limit: finalAutomationsLimit,
          used: usedAutomations,
          remaining: !automationsEnabled
            ? 0
            : finalAutomationsLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(0, finalAutomationsLimit - usedAutomations),
        },
        analytics: {
          enabled: analyticsEnabled,
          level: analyticsEnabled
            ? plan.analyticsLevel === 'none'
              ? 'basic'
              : (plan.analyticsLevel as 'basic' | 'advanced')
            : 'none',
        },
        messaging: {
          enabled: messagingEnabled,
        },
        catalogueItems: {
          enabled: catalogueEnabled,
          limit: finalCatalogueItemsLimit,
          used: usedCatalogueItems,
          remaining: !catalogueEnabled
            ? 0
            : finalCatalogueItemsLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(0, finalCatalogueItemsLimit - usedCatalogueItems),
        },
        catalogueCategories: {
          enabled: catalogueEnabled,
          limit: finalCatalogueCategoriesLimit,
          used: usedCatalogueCategories,
          remaining: !catalogueEnabled
            ? 0
            : finalCatalogueCategoriesLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(
                  0,
                  finalCatalogueCategoriesLimit - usedCatalogueCategories,
                ),
        },
        catalogueOffers: {
          enabled: catalogueEnabled,
          limit: finalCatalogueOffersLimit,
          used: usedCatalogueOffers,
          remaining: !catalogueEnabled
            ? 0
            : finalCatalogueOffersLimit === 'unlimited'
              ? 'unlimited'
              : Math.max(0, finalCatalogueOffersLimit - usedCatalogueOffers),
        },
        inventory: {
          enabled: plan.inventoryEnabled ?? false,
          limit:
            plan.inventoryLimit === -1
              ? 'unlimited'
              : (plan.inventoryLimit ?? 0),
          used: 0,
          remaining: !plan.inventoryEnabled
            ? 0
            : plan.inventoryLimit === -1
              ? 'unlimited'
              : (plan.inventoryLimit ?? 0),
        },
        pos: {
          enabled: plan.posEnabled ?? false,
          limit:
            plan.posTerminalLimit === -1
              ? 'unlimited'
              : (plan.posTerminalLimit ?? 0),
          used: 0,
          remaining: !plan.posEnabled
            ? 0
            : plan.posTerminalLimit === -1
              ? 'unlimited'
              : (plan.posTerminalLimit ?? 0),
        },
        visitors: {
          enabled: plan.visitorsEnabled ?? false,
        },
        inAppChat: {
          enabled: plan.inAppChatEnabled ?? false,
        },
        forms: {
          enabled: plan.formsEnabled ?? false,
          limit: plan.formsLimit === -1 ? 'unlimited' : (plan.formsLimit ?? 0),
          used: 0,
          remaining: !plan.formsEnabled
            ? 0
            : plan.formsLimit === -1
              ? 'unlimited'
              : (plan.formsLimit ?? 0),
        },
        businessQr: {
          enabled: plan.businessQrEnabled ?? false,
        },
        marketingKit: {
          enabled: plan.marketingKitEnabled ?? false,
          limit:
            plan.marketingKitLimit === -1
              ? 'unlimited'
              : (plan.marketingKitLimit ?? 0),
          used: 0,
          remaining: !plan.marketingKitEnabled
            ? 0
            : plan.marketingKitLimit === -1
              ? 'unlimited'
              : (plan.marketingKitLimit ?? 0),
        },
        discovery: {
          enabled: plan.discoveryEnabled ?? false,
        },
        staffRoles: {
          enabled: plan.staffRolesEnabled ?? false,
          limit:
            plan.staffRolesLimit === -1
              ? 'unlimited'
              : (plan.staffRolesLimit ?? 0),
          used: 0,
          remaining: !plan.staffRolesEnabled
            ? 0
            : plan.staffRolesLimit === -1
              ? 'unlimited'
              : (plan.staffRolesLimit ?? 0),
        },
        activityLog: {
          enabled: plan.activityLogEnabled ?? false,
        },
        qrCodes: {
          enabled: plan.qrCodesEnabled ?? false,
          limit:
            plan.qrCodesLimit === -1 ? 'unlimited' : (plan.qrCodesLimit ?? 0),
          used: 0,
          remaining: !plan.qrCodesEnabled
            ? 0
            : plan.qrCodesLimit === -1
              ? 'unlimited'
              : (plan.qrCodesLimit ?? 0),
        },
        features: plan.features || [],
        credits: {
          sms: plan.smsCredits || 0,
          email: plan.emailCredits || 0,
          whatsapp: plan.whatsappCredits || 0,
          ai: plan.aiCredits ?? 0,
        },
        aiCopilot: {
          enabled: plan.aiCopilotEnabled ?? false,
          credits: plan.aiCredits ?? 0,
        },
      },
      addOns: addOnsInfo,
    };
  }

  // --- Admin Methods ---

  async findAllAdmin() {
    const subs = await this.subscriptionRepository.find({
      relations: ['plan', 'business'],
      order: { createdAt: 'DESC' },
    });

    return subs.map((sub) => ({
      id: sub.id,
      business: sub.business?.name || 'Unknown Business',
      businessId: sub.businessId,
      owner: sub.business?.ownerId ? 'Linked' : 'Unknown',
      plan: sub.plan?.name || 'Unknown Plan',
      status: sub.status,
      renewal: sub.endDate
        ? new Date(sub.endDate).toISOString().split('T')[0]
        : 'N/A',
      amount: sub.plan?.monthlyPrice
        ? `₦${Number(sub.plan.monthlyPrice).toLocaleString()}`
        : sub.plan?.isFree
          ? 'Free'
          : 'N/A',
    }));
  }

  async getAdminStats() {
    const allSubs = await this.subscriptionRepository.find({
      where: {
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan'],
    });

    let active = 0;
    let trial = 0;
    let expiringSoon = 0;
    const pastDue = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.EXPIRED },
    });

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    allSubs.forEach((sub) => {
      if (sub.status === SubscriptionStatus.TRIAL) trial++;
      else active++;

      if (sub.endDate > now && sub.endDate <= nextWeek) {
        expiringSoon++;
      }
    });

    return {
      activeSubscriptions: active,
      activeTrials: trial,
      expiringSoon,
      pastDue,
    };
  }

  private async reportCommission(
    business: Business,
    plan: Plan,
    paymentReference: string,
    amount: number,
  ) {
    // Determine the configured commission rate for this payment (first paid
    // subscription = first-payment rate, otherwise recurring rate).
    let isFirstPayment = false;
    let rate = 0;
    try {
      const info = await this.affiliatesService.getCommissionRateForBusiness(
        business.id,
        paymentReference,
      );
      isFirstPayment = info.isFirstPayment;
      rate = info.rate;
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve commission rate for business ${business.id}: ${error.message}`,
      );
    }

    // 1. Internal agent commission (never blocks subscription creation)
    try {
      await this.affiliatesService.processSubscriptionCommission(
        business.id,
        amount,
        paymentReference,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to generate agent commission for business ${business.id}: ${error.message}`,
      );
    }

    // 2. Internal B2B commission (business-owner referrer)
    try {
      await this.affiliatesService.processBusinessReferralCommission(
        business.id,
        amount,
        paymentReference,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to generate B2B commission for business ${business.id}: ${error.message}`,
      );
    }

    // 3. External affiliate system sync (queued, retried with idempotency).
    //    `externalReference` is the unique payment reference so recurring
    //    payments are treated as distinct commission events.
    if (business.referralCode) {
      try {
        await this.affiliateSyncService.enqueueRecordReferral({
          referralCode: business.referralCode,
          businessId: business.id,
          businessName: business.name,
          ownerName: business.owner
            ? `${business.owner.firstName} ${business.owner.lastName}`
            : 'Business Owner',
          email:
            business.officialEmail ||
            business.owner?.email ||
            'billing@vemtap.com',
          phone: business.phone || business.owner?.phone || '',
          planName: plan.name,
          planId: plan.id,
          address: business.address || '',
          amountPaid: amount,
          isFirstPayment,
          rate,
          externalReference: paymentReference,
        });
      } catch (error: any) {
        this.logger.error(
          `Failed to enqueue external affiliate sync for business ${business.id}: ${error.message}`,
        );
      }
    }
  }

  async previewPrice(
    dto: PricePreviewDto,
    businessId?: string,
  ): Promise<
    TaxCalculationResult & {
      plan: Plan;
      addons: any[];
      discount?: any;
    }
  > {
    const plan = await this.plansService.findOne(dto.planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    let planPrice = Number(plan.monthlyPrice || 0);
    if (dto.billingPeriod === BillingPeriod.QUARTERLY)
      planPrice = Number(plan.quarterlyPrice || 0);
    else if (dto.billingPeriod === BillingPeriod.YEARLY)
      planPrice = Number(plan.yearlyPrice || 0);

    let addons: any[] = [];
    if (dto.addonIds && dto.addonIds.length > 0) {
      addons = await this.addonsService.validateAddons(dto.addonIds);
    }

    const addonsTotal = addons.reduce((sum, addon, index) => {
      const qty = dto.addonQuantities?.[index] ?? 1;
      return sum + Number(addon.price) * qty;
    }, 0);

    const promoCode = dto.promoCode?.trim();
    if (promoCode) {
      const promoValidation = await this.couponEngineService.validatePromotion({
        code: promoCode,
        planId: dto.planId,
        billingPeriod: dto.billingPeriod,
        businessId,
        addonsSubtotal: addonsTotal,
      });

      return {
        subtotal: promoValidation.netSubtotal,
        taxAmount: promoValidation.taxAmount,
        total: promoValidation.total,
        taxRule: promoValidation.taxRule,
        plan,
        addons,
        discount: {
          code: promoValidation.promotionCode.code,
          couponName: promoValidation.coupon.name,
          discountType: promoValidation.coupon.discountType,
          amount: promoValidation.coupon.amount,
          duration: promoValidation.coupon.duration,
          discountAmount: promoValidation.discountAmount,
          originalPlanPrice: promoValidation.originalPlanPrice,
          discountedPlanPrice: promoValidation.discountedPlanPrice,
        },
      };
    }

    const subtotal = planPrice + addonsTotal;
    const taxConfig = await this.subscriptionTaxService.getActiveConfig();
    const taxResult = this.subscriptionTaxService.calculateTax(
      subtotal,
      taxConfig,
    );

    return {
      ...taxResult,
      plan,
      addons,
    };
  }
}

