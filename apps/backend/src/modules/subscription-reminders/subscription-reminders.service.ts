import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Cluster } from '../clusters/entities/cluster.entity';
import { Business } from '../businesses/entities/business.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { RotatorImpression } from '../rotator/entities/rotator-impression.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { MailService } from '../mail/mail.service';
import {
  SUBSCRIPTION_REMINDER_STAGES,
  SUBSCRIPTION_REMINDER_LAPSED_STAGE,
  SUBSCRIPTION_REMINDER_LAPSED_DAYS,
  SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS,
  SUBSCRIPTION_REMINDER_CRON,
  SUBSCRIPTION_RENEWAL_URL,
} from './subscription-reminders.constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RENEWAL_GRACE_HOURS = 24;

export interface SubscriptionReminderRunResult {
  expiring: number;
  lapsed: number;
  sentInApp: number;
  sentPush: number;
  sentEmail: number;
  failed: number;
  skippedNoCluster: number;
}

interface ReminderTarget {
  sub: Subscription;
  daysLeft: number;
  isLapsed: boolean;
}

interface ClusterStats {
  name: string;
  people: number;
  businesses: number;
}

/**
 * Periodic renewal reminders for the cluster deals feed.
 *
 * A business's offers are only surfaced in a cluster while it holds a valid
 * subscription whose plan enables the Discovery Network (the gate in
 * ClustersService.buildOfferQuery / RotatorEligibilityService). This job nudges
 * the business owner as that gate approaches (14/7/3 days) and right after the
 * plan lapses, using each cluster's live engagement numbers in the copy.
 *
 * Delivery is multi-channel: in-app Notification (NotificationsService), web
 * push (PushNotificationService → BullMQ), and email (MailService) for urgent stages.
 * The subscription's lastRenewalReminderStage column dedupes so each escalation stage fires once.
 */
@Injectable()
export class SubscriptionRemindersService {
  private readonly logger = new Logger(SubscriptionRemindersService.name);

  private readonly stages: number[];
  private readonly lapsedDays: number;
  private readonly customerLookbackDays: number;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RotatorImpression)
    private readonly impressionRepository: Repository<RotatorImpression>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.stages = this.parseStages(
      this.configService.get<string>('SUBSCRIPTION_REMINDER_STAGES'),
    );
    this.lapsedDays = this.configService.get<number>(
      'SUBSCRIPTION_REMINDER_LAPSED_DAYS',
      SUBSCRIPTION_REMINDER_LAPSED_DAYS,
    );
    this.customerLookbackDays = this.configService.get<number>(
      'SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS',
      SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS,
    );
  }

  @Cron(SUBSCRIPTION_REMINDER_CRON)
  async handleCron(): Promise<void> {
    this.logger.log('Running subscription renewal reminders');
    const result = await this.runRenewalReminders();
    this.logger.log(
      `Renewal reminders done: ${result.sentInApp} in-app, ${result.sentPush} push, ` +
        `${result.sentEmail} email (${result.expiring} expiring, ${result.lapsed} lapsed, ` +
        `${result.failed} failed, ${result.skippedNoCluster} skipped for lack of a cluster)`,
    );
  }

  async runRenewalReminders(): Promise<SubscriptionReminderRunResult> {
    const now = new Date();
    const [expiring, lapsedCandidates] = await Promise.all([
      this.findExpiringSubscriptions(now),
      this.findLapsedCandidates(now),
    ]);

    const eligibleBusinessIds =
      lapsedCandidates.length > 0
        ? await this.currentlyEligibleDiscoveryBusinesses(
            [...new Set(lapsedCandidates.map((c) => c.businessId))],
            now,
          )
        : new Set<string>();
    const lapsed = lapsedCandidates.filter(
      (c) => !eligibleBusinessIds.has(c.businessId),
    );

    const result: SubscriptionReminderRunResult = {
      expiring: expiring.length,
      lapsed: lapsedCandidates.length,
      sentInApp: 0,
      sentPush: 0,
      sentEmail: 0,
      failed: 0,
      skippedNoCluster: 0,
    };

    const targets: ReminderTarget[] = [
      ...expiring.map((sub) => ({
        sub,
        daysLeft: this.daysUntil(sub.endDate, now),
        isLapsed: false,
      })),
      ...lapsed.map((sub) => ({ sub, daysLeft: 0, isLapsed: true })),
    ];

    if (targets.length === 0) return result;

    const businessIds = [...new Set(targets.map((t) => t.sub.businessId))];
    const clusterByBusiness = await this.resolvePrimaryCluster(businessIds);
    if (clusterByBusiness.size === 0) {
      result.skippedNoCluster = targets.length;
      return result;
    }

    const stats = await this.computeClusterStats(
      [...new Set(clusterByBusiness.values())],
      now,
    );
    const owners = await this.resolveActiveOwners(businessIds);

    let sentInApp = 0;
    let sentPush = 0;
    let sentEmail = 0;
    let failed = 0;
    let skippedNoCluster = 0;

    for (const { sub, daysLeft, isLapsed } of targets) {
      try {
        const clusterId = clusterByBusiness.get(sub.businessId);
        if (!clusterId) {
          skippedNoCluster++;
          continue;
        }
        const ownerId = sub.business?.ownerId;
        if (!ownerId) continue;
        const owner = owners.get(ownerId);
        if (!owner) continue;

        const stage = isLapsed
          ? SUBSCRIPTION_REMINDER_LAPSED_STAGE
          : this.stageForDays(daysLeft);

        if (this.alreadyRemindedAtStage(sub, stage)) continue;

        const clusterStats = stats.get(clusterId);
        const { title, message, type } = this.buildCopy(
          daysLeft,
          isLapsed,
          clusterStats,
        );

        await this.notificationsService.create(
          ownerId,
          title,
          message,
          type,
          SUBSCRIPTION_RENEWAL_URL,
        );
        sentInApp++;

        const pushResult = await this.pushNotificationService.sendNotification(
          ownerId,
          title,
          message,
          {
            url: SUBSCRIPTION_RENEWAL_URL,
            category: 'marketing',
            stage,
            clusterId,
          },
        );
        if (pushResult.queued) sentPush++;

        // Send email reminder for urgent and lapsed stages (stage <= 3 or isLapsed)
        if ((stage <= 3 || isLapsed) && owner.email) {
          const customerName =
            [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
            'Valued Merchant';
          const businessName = sub.business?.name || 'Your Business';
          const planName = sub.plan?.name || 'Discovery Plan';

          const emailSent =
            await this.mailService.sendSubscriptionRenewalReminder({
              email: owner.email,
              customerName,
              businessName,
              planName,
              daysLeft,
              isLapsed,
              clusterName: clusterStats?.name ?? 'your area',
              clusterStats: clusterStats
                ? {
                    people: clusterStats.people,
                    businesses: clusterStats.businesses,
                  }
                : undefined,
            });
          if (emailSent) sentEmail++;
        }

        await this.subscriptionRepository.update(sub.id, {
          lastRenewalReminderAt: now,
          lastRenewalReminderStage: stage,
        });
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed processing renewal reminder for subscription ${sub.id}: ${
            (error as Error).message
          }`,
          (error as Error).stack,
        );
      }
    }

    result.sentInApp = sentInApp;
    result.sentPush = sentPush;
    result.sentEmail = sentEmail;
    result.failed = failed;
    result.skippedNoCluster = skippedNoCluster;
    return result;
  }

  // ------------------------------------------------------------------
  // Target selection
  // ------------------------------------------------------------------

  /**
   * Subscriptions about to expire: active/trial Discovery plans whose endDate
   * falls within the furthest reminder stage. Mirrors the feed gate's
   * subscription semantics (status active/trial + discoveryEnabled plan).
   */
  private async findExpiringSubscriptions(now: Date): Promise<Subscription[]> {
    const maxStage = Math.max(...this.stages);
    const windowEnd = this.addDays(now, maxStage);

    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.business', 'business')
      .where('sub.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .andWhere('sub.deletedAt IS NULL')
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere('sub.endDate >= :now', { now })
      .andWhere('sub.endDate <= :windowEnd', { windowEnd })
      .getMany();
  }

  /**
   * Subscriptions that just lapsed: Discovery plans whose endDate (plus the
   * 24h renewal grace used by the feed gate) has passed within the lapsed
   * window. Whether the business has since renewed is checked separately in
   * runRenewalReminders via currentlyEligibleDiscoveryBusinesses.
   */
  private async findLapsedCandidates(now: Date): Promise<Subscription[]> {
    const lapsedSince = this.addDays(now, -this.lapsedDays);
    const gracePassed = this.addHours(now, -RENEWAL_GRACE_HOURS);

    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.business', 'business')
      .where('sub.deletedAt IS NULL')
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere('sub.endDate >= :lapsedSince', { lapsedSince })
      .andWhere('sub.endDate <= :gracePassed', { gracePassed })
      .getMany();
  }

  private async currentlyEligibleDiscoveryBusinesses(
    businessIds: string[],
    now: Date,
  ): Promise<Set<string>> {
    const rows = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('DISTINCT sub.businessId', 'businessId')
      .innerJoin('sub.plan', 'plan')
      .where('sub.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .andWhere('sub.deletedAt IS NULL')
      .andWhere('sub.businessId IN (:...businessIds)', { businessIds })
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere("sub.endDate + INTERVAL '24 hours' > :now", { now })
      .getRawMany<{ businessId: string }>();
    return new Set(rows.map((r) => r.businessId));
  }

  // ------------------------------------------------------------------
  // Cluster resolution + stats
  // ------------------------------------------------------------------

  /**
   * Maps each business to its primary cluster: the cluster of its main branch
   * if one exists, otherwise the first branch's cluster. Businesses without
   * any cluster membership are omitted (nothing to remind them about).
   */
  private async resolvePrimaryCluster(
    businessIds: string[],
  ): Promise<Map<string, string>> {
    const branches = await this.branchRepository.find({
      where: { businessId: In(businessIds) },
      select: ['id', 'businessId', 'clusterId', 'isMainBranch'],
    });

    const result = new Map<string, string>();
    for (const branch of branches) {
      if (!branch.clusterId) continue;
      const existing = result.get(branch.businessId);
      if (!existing) {
        result.set(branch.businessId, branch.clusterId);
      } else if (branch.isMainBranch) {
        result.set(branch.businessId, branch.clusterId);
      }
    }
    return result;
  }

  private async computeClusterStats(
    clusterIds: string[],
    now: Date,
  ): Promise<Map<string, ClusterStats>> {
    const clusters = await this.clusterRepository.find({
      where: { id: In(clusterIds) },
      select: ['id', 'name'],
    });
    const names = new Map(clusters.map((c) => [c.id, c.name]));

    const since = this.addDays(now, -this.customerLookbackDays);

    const peopleRows = await this.impressionRepository
      .createQueryBuilder('i')
      .select('i.clusterId', 'clusterId')
      .addSelect(
        'COUNT(DISTINCT COALESCE(i.sessionToken, i.customerId))',
        'people',
      )
      .where('i.clusterId IN (:...ids)', { ids: clusterIds })
      .andWhere('i.createdAt >= :since', { since })
      .groupBy('i.clusterId')
      .getRawMany<{ clusterId: string; people: string }>();

    const businessRows = await this.branchRepository
      .createQueryBuilder('b')
      .select('b.clusterId', 'clusterId')
      .addSelect('COUNT(DISTINCT b.businessId)', 'businesses')
      .where('b.clusterId IN (:...ids)', { ids: clusterIds })
      .andWhere('b.isActive = :active', { active: true })
      .groupBy('b.clusterId')
      .getRawMany<{ clusterId: string; businesses: string }>();

    const people = new Map(
      peopleRows.map((r) => [r.clusterId, Number(r.people)]),
    );
    const businesses = new Map(
      businessRows.map((r) => [r.clusterId, Number(r.businesses)]),
    );

    const stats = new Map<string, ClusterStats>();
    for (const id of clusterIds) {
      stats.set(id, {
        name: names.get(id) ?? 'your area',
        people: people.get(id) ?? 0,
        businesses: businesses.get(id) ?? 0,
      });
    }
    return stats;
  }

  // ------------------------------------------------------------------
  // Copy + delivery helpers
  // ------------------------------------------------------------------

  private buildCopy(
    daysLeft: number,
    isLapsed: boolean,
    stats?: ClusterStats,
  ): { title: string; message: string; type: string } {
    const clusterName = stats?.name ?? 'your area';
    const people = stats?.people ?? 0;
    const businesses = stats?.businesses ?? 0;
    const peopleText = `${people.toLocaleString()}`;
    const businessesText = `${businesses.toLocaleString()}`;
    const daysText = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

    if (isLapsed) {
      return {
        title: `Your offers left the ${clusterName} deals feed`,
        message: `Your plan expired, so customers in ${clusterName} can no longer see your deals. ${businessesText} businesses there are reaching ${peopleText} shoppers. Renew to rejoin.`,
        type: 'error',
      };
    }

    if (daysLeft <= 3) {
      return {
        title: `Last call: renew before ${clusterName} expires`,
        message: `In ${daysText} your offers leave the ${clusterName} deals feed while ${businessesText} nearby businesses reach ${peopleText} shoppers. Renew today.`,
        type: 'warning',
      };
    }

    if (daysLeft <= 7) {
      return {
        title: `Your offers leave ${clusterName} in ${daysLeft} days`,
        message: `Your offers will disappear from the ${clusterName} feed in ${daysText}. ${peopleText} shoppers browsed deals there this month — and ${businessesText} businesses are staying visible. Renew to keep showing up.`,
        type: 'warning',
      };
    }

    return {
      title: `Your deals in ${clusterName} expire in ${daysLeft} days`,
      message: `${peopleText} people checked deals in ${clusterName} this month — renew now to stay visible to them.`,
      type: 'warning',
    };
  }

  private async resolveActiveOwners(
    businessIds: string[],
  ): Promise<Map<string, User>> {
    const businesses = await this.businessRepository.find({
      where: { id: In(businessIds) },
      select: ['id', 'ownerId'],
    });
    const ownerIds = [
      ...new Set(businesses.map((b) => b.ownerId).filter(Boolean)),
    ];
    if (ownerIds.length === 0) return new Map();

    const owners = await this.userRepository.find({
      where: { id: In(ownerIds), status: UserStatus.ACTIVE },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
    return new Map(owners.map((o) => [o.id, o]));
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private stageForDays(daysLeft: number): number {
    // Stages are stored descending (14,7,3). Pick the tightest stage whose
    // threshold is still >= daysLeft so 5 days maps to 7 and 2 days to 3.
    const ascending = [...this.stages].sort((a, b) => a - b);
    for (const stage of ascending) {
      if (daysLeft <= stage) return stage;
    }
    return Math.max(...this.stages);
  }

  private alreadyRemindedAtStage(sub: Subscription, stage: number): boolean {
    // Exact-stage dedupe: a lower (more urgent) stage is an escalation and
    // should still fire even if a higher stage was already delivered.
    return sub.lastRenewalReminderStage === stage;
  }

  private parseStages(raw: string | undefined): number[] {
    const parsed = (raw ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => b - a);
    return parsed.length > 0
      ? parsed
      : ([...SUBSCRIPTION_REMINDER_STAGES] as number[]);
  }

  private daysUntil(date: Date, from: Date): number {
    return Math.max(
      0,
      Math.ceil((date.getTime() - from.getTime()) / MS_PER_DAY),
    );
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addHours(date: Date, hours: number): Date {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  }
}
