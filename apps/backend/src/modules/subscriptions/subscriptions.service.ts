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
import { PaymentsService } from '../payments/payments.service';
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
import { ExternalAffiliateService } from '../affiliates/external-affiliate.service';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { AddonsService } from './services/addons.service';
import { AddOn } from './entities/addon.entity';

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
    private readonly externalAffiliateService: ExternalAffiliateService,
    @Inject(forwardRef(() => QrThriveService))
    private readonly qrThriveService: QrThriveService,
    private readonly addonsService: AddonsService,
  ) {}

  async activeSubscription(businessId?: string): Promise<Subscription | null> {
    if (!businessId) return null;
    const sub = await this.subscriptionRepository.findOne({
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
        return null;
      }
    }

    return sub;
  }

  async subscribeToFreePlan(
    businessId: string,
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
    });
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
    let authCode = null;
    let paymentData: any = null;

    if (paymentReference) {
      paymentData =
        await this.paymentsService.verifyTransaction(paymentReference);
      if (!paymentData) {
        throw new BadRequestException('Payment verification failed');
      }
      authCode = paymentData.authorization?.authorization_code;
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

          const totalAmount = planPrice + addonsTotal;

          await this.paymentsService.recordPayment({
            reference: paymentReference,
            amount: totalAmount,
            purpose:
              addons.length > 0
                ? PaymentPurpose.PLAN_WITH_ADDONS
                : PaymentPurpose.SUBSCRIPTION,
            status: PaymentStatus.SUCCESS,
            metadata: { planId, billingPeriod, addonIds, addonQuantities },
            businessId,
            userId: business.ownerId,
          });

          await this.reportCommission(business, plan, paymentReference);
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

    const activeSub = await this.activeSubscription(businessId);
    if (activeSub) {
      activeSub.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepository.save(activeSub);
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
    }

    return { subscription: savedSub, addOns: purchasedAddOns };
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

      const charge: any = await this.paymentsService.chargeAuthorization(
        amount,
        ownerEmail,
        sub.paystackAuthorizationCode,
      );

      if (charge && charge.status === 'success') {
        this.logger.log(
          `Successfully charged subscription ${sub.id}. Upgrading to ACTIVE.`,
        );

        await this.paymentsService.recordPayment({
          reference: charge.reference,
          amount: amount,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: { subscriptionId: sub.id, planId: sub.planId },
          businessId: sub.businessId,
          userId: sub.business?.ownerId,
        });

        await this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);

        // Trigger affiliate commission
        if (sub.business) {
          await this.reportCommission(sub.business, sub.plan, charge.reference);
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

      const charge: any = await this.paymentsService.chargeAuthorization(
        amount,
        ownerEmail,
        sub.paystackAuthorizationCode,
      );

      if (charge && charge.status === 'success') {
        this.logger.log(
          `Successfully renewed subscription ${sub.id}. Upgrading end date.`,
        );

        await this.paymentsService.recordPayment({
          reference: charge.reference,
          amount: amount,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: {
            subscriptionId: sub.id,
            planId: sub.planId,
            renewal: true,
          },
          businessId: sub.businessId,
          userId: sub.business?.ownerId,
        });

        // Trigger affiliate commission
        if (sub.business) {
          await this.reportCommission(sub.business, sub.plan, charge.reference);
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

    const baseCatalogueOffersLimit =
      plan.maxCatalogueOffers === -1
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
  ) {
    // 1. Internal System
    await this.affiliatesService.processSubscriptionCommission(
      business.id,
      plan.monthlyPrice,
      paymentReference,
    );

    // 2. External Affiliate System
    if (business.referralCode) {
      await this.externalAffiliateService.recordReferral({
        referralCode: business.referralCode,
        businessName: business.name,
        ownerName: business.owner
          ? `${business.owner.firstName} ${business.owner.lastName}`
          : 'Business Owner',
        email:
          business.officialEmail ||
          business.owner?.email ||
          'billing@vemtap.com',
        phone: business.phone || business.owner?.phone || '',
        planType: this.mapPlanToExternal(plan.name),
        address: business.address || '',
      });
    }
  }

  private mapPlanToExternal(planName: string): string {
    const name = planName.toUpperCase();
    if (name.includes('BASIC')) return 'BASIC';
    if (name.includes('STARTER') || name.includes('STANDARD')) return 'STARTER';
    if (name.includes('PRO') || name.includes('PROFESSIONAL'))
      return 'PROFESSIONAL';
    if (name.includes('ENTERPRISE') || name.includes('PREMIUM'))
      return 'ENTERPRISE';
    return 'BASIC'; // Fallback
  }
}
