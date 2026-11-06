import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import {
  BillingPeriod,
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Business } from '../../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions.service';
import { PlansService } from '../plans.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { PaymentPurpose } from '../../payments/entities/payment.entity';
import { PaymentsService } from '../../payments/payments.service';
import { SUBSCRIPTION_RENEWAL_URL } from '../../subscription-reminders/subscription-reminders.constants';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days before the end of a trial a reminder goes out, each once. */
export const TRIAL_REMINDER_DAYS = [3, 1] as const;
/** In-app route the mobile app opens for subscribing. */
const APP_SUBSCRIBE_PATH = '/business/subscribe';

export interface TrialEligibility {
  eligible: boolean;
  trialUsedAt: Date | null;
}

/**
 * Free, cardless trials: who may start one, starting it, reminding the owner
 * before it ends and telling them when it has. Ending a trial (back to the
 * free plan, never charged) is `SubscriptionsService.processExpiredTrials`.
 */
@Injectable()
export class TrialService implements OnModuleInit {
  private readonly logger = new Logger(TrialService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.subscriptionsService.onTrialExpired((sub) => this.notifyEnded(sub));
  }

  async eligibility(businessId: string): Promise<TrialEligibility> {
    const usage = await this.subscriptionsService.trialUsage(businessId);
    return { eligible: !usage.used, trialUsedAt: usage.usedAt };
  }

  /** Start the business's one free trial of a paid plan. Nothing is charged. */
  async startTrial(
    businessId: string,
    planId: string,
    billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
  ) {
    const plan = await this.plansService.findOne(planId);
    if (plan.isFree) {
      throw new BadRequestException(
        'The free plan has no trial; it is always free.',
      );
    }
    if (!plan.trialDurationDays || plan.trialDurationDays <= 0) {
      throw new BadRequestException('This plan does not offer a free trial.');
    }
    const { eligible } = await this.eligibility(businessId);
    if (!eligible) {
      throw new BadRequestException(
        'This business has already used its free trial. Subscribe to continue.',
      );
    }
    const result = await this.subscriptionsService.subscribe({
      planId,
      businessId,
      billingPeriod,
      isTrial: true,
    });
    return result.subscription;
  }

  /** Whole days until `end`, rounded up so "ends tonight" reads as 1. */
  static daysRemaining(
    end: Date | null | undefined,
    now = new Date(),
  ): number | null {
    if (!end) return null;
    return Math.max(
      0,
      Math.ceil((new Date(end).getTime() - now.getTime()) / DAY_MS),
    );
  }

  /**
   * Hourly: remind owners whose trial ends in 3 days and in 1 day. Each stage
   * is sent once; `trialReminderStage` remembers the last one sent.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendTrialReminders(now: Date = new Date()): Promise<number> {
    const horizon = new Date(
      now.getTime() + Math.max(...TRIAL_REMINDER_DAYS) * DAY_MS,
    );
    const trials = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        endDate: Between(now, horizon),
      },
      relations: ['plan', 'business', 'business.owner'],
    });
    let sent = 0;
    for (const sub of trials) {
      const daysLeft = TrialService.daysRemaining(sub.endDate, now) ?? 0;
      // The tightest stage the trial has reached, e.g. 1 when a day is left.
      const stage = [...TRIAL_REMINDER_DAYS]
        .sort((a, b) => a - b)
        .find((days) => daysLeft <= days);
      if (stage === undefined) continue;
      if (sub.trialReminderStage !== null && sub.trialReminderStage <= stage) {
        continue;
      }
      await this.notifyOwner(sub, daysLeft);
      sub.trialReminderStage = stage;
      await this.subscriptionRepository.update(sub.id, {
        trialReminderStage: stage,
      });
      sent += 1;
    }
    return sent;
  }

  private async notifyEnded(sub: Subscription): Promise<void> {
    await this.notifyOwner(sub, 0);
  }

  /** Email, in-app notification and push to the business owner. */
  private async notifyOwner(
    sub: Subscription,
    daysLeft: number,
  ): Promise<void> {
    const business =
      sub.business ??
      (await this.businessRepository.findOne({
        where: { id: sub.businessId },
        relations: ['owner'],
      }));
    const owner = business?.owner;
    if (!business || !owner) return;
    const planName = sub.plan?.name ?? 'paid';
    const ended = daysLeft <= 0;
    const title = ended
      ? 'Your free trial has ended'
      : `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    const message = ended
      ? `${business.name} is back on the free plan. Nothing was charged — subscribe to get ${planName} back.`
      : `You won't be charged automatically. Subscribe to keep ${planName} for ${business.name}.`;

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const email = business.officialEmail || owner.email;
    if (email) {
      await this.mailService.sendTrialEndingReminder({
        email,
        customerName: owner.firstName ?? '',
        businessName: business.name,
        planName,
        daysLeft,
        subscribeUrl: frontendUrl
          ? `${frontendUrl.replace(/\/$/, '')}${SUBSCRIPTION_RENEWAL_URL}`
          : undefined,
      });
    }

    const data = {
      type: ended ? 'trial_ended' : 'trial_ending',
      category: 'billing',
      url: APP_SUBSCRIBE_PATH,
      daysLeft: String(daysLeft),
    };
    try {
      const notifications = this.moduleRef.get(NotificationsService, {
        strict: false,
      });
      await notifications.create(
        owner.id,
        title,
        message,
        ended ? 'warning' : 'info',
        APP_SUBSCRIBE_PATH,
        data,
      );
    } catch (err) {
      this.logger.warn(
        `In-app trial notice failed for ${owner.id}: ${(err as Error).message}`,
      );
    }
    try {
      const push = this.moduleRef.get(PushNotificationService, {
        strict: false,
      });
      await push.sendNotification(owner.id, title, message, data);
    } catch (err) {
      this.logger.warn(
        `Trial push failed for ${owner.id}: ${(err as Error).message}`,
      );
    }
  }

  // ─── billing screen ──────────────────────────────────────────────────

  /** Subscription and add-on payments, newest first. */
  async billingHistory(businessId: string, page = 1, limit = 20) {
    const result = await this.paymentsService.listForBusiness(businessId, {
      purposes: [
        PaymentPurpose.SUBSCRIPTION,
        PaymentPurpose.PLAN_WITH_ADDONS,
        PaymentPurpose.ADDON,
      ],
      page,
      limit,
    });
    return {
      data: result.data.map((payment) => {
        const meta = (payment.metadata ?? {}) as Record<string, unknown>;
        return {
          id: payment.id,
          reference: payment.reference,
          amount: Number(payment.amount),
          currency: payment.currency ?? 'NGN',
          status: payment.status,
          purpose: payment.purpose,
          planId: (meta.planId as string) ?? null,
          billingPeriod: (meta.billingPeriod as string) ?? null,
          subtotal: meta.subtotal !== undefined ? Number(meta.subtotal) : null,
          taxAmount:
            meta.taxAmount !== undefined ? Number(meta.taxAmount) : null,
          createdAt: payment.createdAt.toISOString(),
        };
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.page * result.limit < result.total,
    };
  }

  /** The card the current paid subscription was bought with, if any. */
  async paymentMethod(businessId: string) {
    const sub = await this.subscriptionsService.activeSubscription(businessId);
    if (!sub) throw new NotFoundException('No active subscription');
    const latest = sub.cardSummary
      ? sub
      : await this.subscriptionRepository.findOne({
          where: { businessId },
          order: { createdAt: 'DESC' },
        });
    const card = sub.cardSummary ?? latest?.cardSummary ?? null;
    return {
      hasCard: Boolean(card),
      card,
      // Renewals only charge a saved card on paid, non-trial subscriptions.
      autoRenews: Boolean(
        sub.paystackAuthorizationCode &&
        sub.status === SubscriptionStatus.ACTIVE &&
        !sub.plan?.isFree,
      ),
    };
  }
}
