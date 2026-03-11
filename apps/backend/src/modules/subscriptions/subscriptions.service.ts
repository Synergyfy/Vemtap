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
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { PaymentsService } from '../payments/payments.service';
import { Device } from '../devices/entities/device.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
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
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(sub);
      return null;
    }

    return sub;
  }

  async subscribe(subscribeDto: SubscribeDto): Promise<Subscription> {
    const {
      planId,
      businessId,
      billingPeriod,
      paymentReference,
      isTrial = false,
    } = subscribeDto;

    const plan = await this.plansService.findOne(planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not active');
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['owner'],
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
      const paymentData =
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
        if (!paymentReference) {
          throw new BadRequestException(
            'Payment reference is required for direct subscription',
          );
        }

        await this.paymentsService.recordPayment({
          reference: paymentReference,
          amount: plan.monthlyPrice,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.SUCCESS,
          metadata: { planId, billingPeriod },
          businessId,
          userId: business.ownerId,
        });

        if (billingPeriod === BillingPeriod.MONTHLY)
          endDate.setMonth(endDate.getMonth() + 1);
        else if (billingPeriod === BillingPeriod.QUARTERLY)
          endDate.setMonth(endDate.getMonth() + 3);
        else if (billingPeriod === BillingPeriod.YEARLY)
          endDate.setFullYear(endDate.getFullYear() + 1);
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
      // Also update owner who might not be in a branch? (Actually they should be in Main Branch now)
      await this.userRepository.update(
        { id: business.ownerId },
        { status: UserStatus.ACTIVE },
      );
    }

    return savedSub;
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
    const usedBranches = branches.length;

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
          limit: 'unlimited',
          used: usedTags,
          remaining: 'unlimited',
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
}
