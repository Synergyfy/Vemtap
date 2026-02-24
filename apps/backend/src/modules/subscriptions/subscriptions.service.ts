import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from './entities/subscription.entity';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { PlansService } from './plans.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Business } from '../businesses/entities/business.entity';
import { PaymentsService } from '../payments/payments.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async activeSubscription(businessId: string): Promise<Subscription | null> {
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
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(sub);
      return null;
    }

    return sub;
  }

  async subscribe(subscribeDto: SubscribeDto): Promise<Subscription> {
    const { planId, businessId, billingPeriod, paymentReference } =
      subscribeDto;

    const plan = await this.plansService.findOne(planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not active');
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let status = SubscriptionStatus.ACTIVE;
    let trialEndDate: Date | null = null;
    const startDate = new Date();
    let endDate = new Date(startDate);
    let authCode = null;

    if (paymentReference) {
      // Always verify payment if reference provided, to capture auth code for future billing
      const paymentData =
        await this.paymentsService.verifyTransaction(paymentReference);
      if (!paymentData) {
        throw new BadRequestException('Payment verification failed');
      }
      authCode = paymentData.authorization?.authorization_code;
    }

    // Determine status and endDate
    if (plan.isFree) {
      // Free plan: Free forever
      endDate.setFullYear(endDate.getFullYear() + 10);
      status = SubscriptionStatus.ACTIVE;
    } else {
      // Paid plan
      const trialDays = plan.trialDurationDays || 0;

      if (trialDays > 0) {
        status = SubscriptionStatus.TRIAL;
        const trialEnd = new Date(startDate);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        trialEndDate = trialEnd;
        endDate = trialEnd;
      } else {
        // Immediate charge required
        if (!paymentReference) {
          throw new BadRequestException(
            'Payment reference is required for paid plans',
          );
        }
        // Verification already done above

        await this.paymentsService.recordPayment({
          reference: paymentReference,
          amount: plan.monthlyPrice, // Ideally calculate based on period
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: { planId, billingPeriod },
          businessId,
          userId: business.ownerId, // Assuming business has ownerId
        });

        // Set endDate based on billing period
        if (billingPeriod === BillingPeriod.MONTHLY)
          endDate.setMonth(endDate.getMonth() + 1);
        else if (billingPeriod === BillingPeriod.QUARTERLY)
          endDate.setMonth(endDate.getMonth() + 3);
        else if (billingPeriod === BillingPeriod.YEARLY)
          endDate.setFullYear(endDate.getFullYear() + 1);
      }
    }

    // Deactivate previous subscriptions
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

    return this.subscriptionRepository.save(newSub);
  }

  async processExpiredTrials() {
    const now = new Date();
    const expiredTrials = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        endDate: LessThanOrEqual(now),
      },
      relations: ['plan', 'business'],
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

      // Calculate Amount
      let amount = sub.plan.monthlyPrice;
      if (sub.billingPeriod === BillingPeriod.QUARTERLY)
        amount = sub.plan.quarterlyPrice;
      if (sub.billingPeriod === BillingPeriod.YEARLY)
        amount = sub.plan.yearlyPrice;

      if (amount <= 0) {
        this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);
        continue;
      }

      const ownerEmail = 'unknown@latap.com';

      const charge = await this.paymentsService.chargeAuthorization(
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

        this.activateSubscription(sub);
        await this.subscriptionRepository.save(sub);
      } else {
        this.logger.error(`Failed to charge subscription ${sub.id}. Expiring.`);
        sub.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(sub);
      }
    }
  }

  private activateSubscription(sub: Subscription) {
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
  }

  async getCapabilities(businessId: string) {
    const sub = await this.activeSubscription(businessId);

    // Default fallback if no plan
    let plan = sub?.plan;
    if (!plan) {
      // Try to get a default free plan
      const plans = await this.plansService.findAll(true);
      plan = plans.find((p) => p.isFree);
    }

    if (!plan) {
      throw new BadRequestException(
        'No active plan and no default free plan available',
      );
    }

    // Load business with relations to count usage
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['staff', 'devices', 'branches'],
    });

    const usedStaff = business?.staff?.length || 0;
    const usedTags = business?.devices?.length || 0;
    const usedBranches = business?.branches?.length || 0;

    // We can expand loyalty usage metrics as needed. For now just mock it or calculate it properly if entities exist.
    // e.g. usedLoyaltyPrograms
    const usedLoyaltyPrograms = 0;

    return {
      plan: plan.name,
      isActive:
        sub?.status === SubscriptionStatus.ACTIVE ||
        sub?.status === SubscriptionStatus.TRIAL,
      isTrial: sub?.status === SubscriptionStatus.TRIAL,
      capabilities: {
        teamMembers: {
          limit: plan.teamMembersLimit ?? 'unlimited',
          used: usedStaff,
          remaining:
            plan.teamMembersLimit === null
              ? 'unlimited'
              : Math.max(0, plan.teamMembersLimit - usedStaff),
        },
        tags: {
          limit: plan.tagsLimit ?? 'unlimited',
          used: usedTags,
          remaining:
            plan.tagsLimit === null
              ? 'unlimited'
              : Math.max(0, plan.tagsLimit - usedTags),
        },
        loyaltyPrograms: {
          limit: plan.loyaltyLimit ?? 'unlimited',
          used: usedLoyaltyPrograms,
          remaining:
            plan.loyaltyLimit === null
              ? 'unlimited'
              : Math.max(0, plan.loyaltyLimit - usedLoyaltyPrograms),
        },
        branches: {
          limit: plan.branchLimit ?? 'unlimited',
          used: usedBranches,
          remaining:
            plan.branchLimit === null
              ? 'unlimited'
              : Math.max(0, plan.branchLimit - usedBranches),
        },
        analytics: plan.analyticsLevel,
        features: plan.features || [],
        credits: {
          sms: plan.smsCredits || 0,
          email: plan.emailCredits || 0,
          whatsapp: plan.whatsappCredits || 0,
        },
      },
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
      owner: sub.business?.ownerId ? 'Linked' : 'Unknown', // Add robust owner fetch if needed
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
    // Calculate dynamic real-time stats
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
}
