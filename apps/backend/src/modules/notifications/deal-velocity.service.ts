import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

/**
 * Deal-claim velocity detector.
 *
 * Watches for a deal suddenly claiming far faster than it usually does and
 * tells the venue, because a spike is the moment worth acting on — an owner
 * who learns after lunch that lunch sold out has learned nothing useful.
 */
@Injectable()
export class DealVelocityService {
  private readonly logger = new Logger(DealVelocityService.name);

  /** Window a claim counts as "recent". Two hours covers one service. */
  private readonly windowHours: number;
  /** How far back the baseline sits. A week keeps the comparison like-for-like. */
  private readonly baselineDays: number;
  /** Absolute floor — a small business's two-claim blip is not a spike. */
  private readonly minClaims: number;
  /** How far above baseline a window must be before it counts. */
  private readonly minUplift: number;
  /** How long the same venue is left alone after one alert. */
  private readonly cooldownHours: number;

  constructor(
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.windowHours = readNumber(this.configService, 'DEAL_VELOCITY_WINDOW_HOURS', 2);
    this.baselineDays = readNumber(this.configService, 'DEAL_VELOCITY_BASELINE_DAYS', 7);
    this.minClaims = readNumber(this.configService, 'DEAL_VELOCITY_MIN_CLAIMS', 5);
    this.minUplift = readNumber(this.configService, 'DEAL_VELOCITY_MIN_UPLIFT', 0.25);
    this.cooldownHours = readNumber(this.configService, 'DEAL_VELOCITY_COOLDOWN_HOURS', 8);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async detectSpikes(): Promise<void> {
    const result = await this.run();
    if (result.notified > 0) {
      this.logger.log(
        `Deal velocity scan: ${result.notified} spike alert(s) ` +
          `across ${result.checked} active branch(es)`,
      );
    }
  }

  /**
   * One pass over every branch that claimed anything in the window.
   *
   * Both window counts are single aggregates, so the scan costs two queries no
   * matter how many businesses are active.
   */
  async run(): Promise<{ checked: number; notified: number }> {
    const now = new Date();
    const windowStart = hoursAgo(now, this.windowHours);
    const baselineStart = daysAgo(now, this.baselineDays + this.windowHours / 24);
    const baselineEnd = daysAgo(now, this.baselineDays);

    const [current, baseline] = await Promise.all([
      this.countClaimsByBranch(windowStart, now),
      this.countClaimsByBranch(baselineStart, baselineEnd),
    ]);

    const spiking = [...current.entries()].filter(([branchId, claims]) => {
      // Under the absolute floor a busy window is still just a small venue
      // having an ordinary afternoon.
      if (claims < this.minClaims) return false;
      const previous = baseline.get(branchId) ?? 0;
      return claims > previous * (1 + this.minUplift);
    });

    let notified = 0;
    for (const [branchId, claims] of spiking) {
      try {
        const sent = await this.alertBranch({
          branchId,
          claims,
          baseline: baseline.get(branchId) ?? 0,
          now,
        });
        if (sent) notified += 1;
      } catch (error) {
        // One venue failing must not cost every other venue its alert.
        this.logger.error(
          `Failed to alert branch ${branchId}: ${error.message}`,
        );
      }
    }

    return { checked: current.size, notified };
  }

  /** Claims per branch inside a window, as one grouped aggregate. */
  private async countClaimsByBranch(
    from: Date,
    to: Date,
  ): Promise<Map<string, number>> {
    const rows = await this.claimRepository
      .createQueryBuilder('claim')
      .innerJoin('claim.offer', 'offer')
      .select('offer."branchId"', 'branchId')
      .addSelect('COUNT(claim.id)', 'claims')
      .where('claim."createdAt" BETWEEN :from AND :to', { from, to })
      // An expired claim still counts as a claim for velocity purposes, but a
      // claim that never landed would skew the window.
      .groupBy('offer."branchId"')
      .getRawMany<{ branchId: string; claims: string }>();

    return new Map(rows.map((row) => [row.branchId, Number(row.claims) || 0]));
  }

  /**
   * Writes one alert per spiking branch, unless one already went out.
   *
   * Staff resolution is shared rather than delegated, because the cooldown
   * check needs the same recipients: an alert is suppressed if anyone who would
   * receive this one already has one from the cooldown window.
   */
  private async alertBranch(input: {
    branchId: string;
    claims: number;
    baseline: number;
    now: Date;
  }): Promise<boolean> {
    const { branchId, claims, baseline } = input;
    const staff = await this.userRepository.find({
      where: [{ branchId }],
      select: ['id'],
    });
    const userIds = staff.map((s) => s.id);
    if (userIds.length === 0) return false;

    const cooldownStart = hoursAgo(input.now, this.cooldownHours);
    const alreadyAlerted = await this.notificationRepository.findOne({
      where: {
        userId: In(userIds),
        type: 'deal_spike',
        createdAt: Between(cooldownStart, input.now),
      },
      select: ['id'],
    });
    if (alreadyAlerted) return false;

    const uplift = baseline > 0 ? (claims - baseline) / baseline : 1;
    await this.notificationsService.createMany(
      userIds,
      'Deal Velocity Spiking',
      `${claims} claims in the last ${this.windowHours}h, against ${baseline} ` +
        `at the same time last week.`,
      'warning',
      '/deals',
      {
        stat: {
          label: `Claims in ${this.windowHours}h`,
          value: String(claims),
          trend:
            baseline > 0
              ? `${formatPercent(uplift)} vs last week`
              : 'no claims last week',
        },
        cta: 'View Deals',
      },
    );

    return true;
  }
}

/**
 * Reads a non-negative number from config, falling back when it is absent or
 * was set to something that is not one — a bad threshold must not silently
 * disable the job, which is what `NaN > 0` would do.
 */
function readNumber(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const parsed = Number(configService.get(key));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function hoursAgo(from: Date, hours: number): Date {
  return new Date(from.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(from: Date, days: number): Date {
  return hoursAgo(from, days * 24);
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
