import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cluster } from '../clusters/entities/cluster.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { CatalogueOfferClaimStatus } from '../catalogue/entities/catalogue-offer-claim.entity';
import {
  RotatorImpression,
  RotatorEventType,
} from './entities/rotator-impression.entity';
import { RotatorRotationRecord } from './entities/rotator-rotation-record.entity';
import {
  ROTATOR_REFRESH_QUEUE,
  RotatorImpressionJobData,
  RotatorViewClickJobData,
  rotationWindowId,
} from './rotator.constants';
import { RotatorEligibilityService } from './rotator-eligibility.service';

@Injectable()
export class RotatorAnalyticsService {
  private readonly logger = new Logger(RotatorAnalyticsService.name);

  constructor(
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(RotatorImpression)
    private readonly impressionRepository: Repository<RotatorImpression>,
    @InjectRepository(RotatorRotationRecord)
    private readonly recordRepository: Repository<RotatorRotationRecord>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    @InjectQueue(ROTATOR_REFRESH_QUEUE)
    private readonly refreshQueue: Queue,
    private readonly eligibility: RotatorEligibilityService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Fire an impression event asynchronously (fire-and-forget). Impression rows
   * are deduped per (sessionToken, windowId, offerId) by the worker. Enqueues
   * are also deduped here so tokenless page views in the same rotation window
   * don't fan out one job per request: at most one enqueue per (cluster, window,
   * visitor) where a tokenless visitor collapses to the "anon" bucket.
   */
  async recordImpressions(
    clusterId: string,
    offerIds: string[],
    windowId: number,
    opts?: { customerId?: string | null; sessionToken?: string | null },
  ): Promise<void> {
    try {
      const identity = opts?.sessionToken ?? opts?.customerId ?? 'anon';
      const dedupKey = `rotator:imp:dedup:${clusterId}:${windowId}:${identity}`;
      const seen = await this.cache.get<boolean>(dedupKey);
      if (seen) return;

      const global = await this.eligibility.getGlobalConfig();
      const dedupTtl = Math.max(global.windowSeconds, 5) * 1000;

      await this.cache.set(dedupKey, true, dedupTtl);
      await this.refreshQueue.add(
        'record-impressions',
        { clusterId, offerIds, windowId, ...opts },
        {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2_000 },
        },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue impression recording for cluster ${clusterId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Persist a batch of impression events. Called by the worker. The dedupe
   * lookup (when a session token is present) and the insert are each done in a
   * single batched query instead of one query pair per offer.
   */
  async persistImpressions(job: RotatorImpressionJobData): Promise<void> {
    const { clusterId, offerIds, windowId, customerId, sessionToken } = job;

    let toPersist = offerIds;
    if (sessionToken) {
      const existing = await this.impressionRepository.find({
        where: {
          clusterId,
          windowId: String(windowId),
          eventType: RotatorEventType.IMPRESSION,
          sessionToken,
          offerId: In(offerIds),
        },
        select: ['offerId'],
      });
      if (existing.length > 0) {
        const alreadyPersisted = new Set(existing.map((e) => e.offerId));
        toPersist = offerIds.filter((id) => !alreadyPersisted.has(id));
      }
    }

    if (toPersist.length === 0) return;

    const rows = toPersist.map((offerId) =>
      this.impressionRepository.create({
        clusterId,
        offerId,
        windowId: String(windowId),
        eventType: RotatorEventType.IMPRESSION,
        customerId: customerId ?? null,
        sessionToken: sessionToken ?? null,
      }),
    );
    await this.impressionRepository.save(rows);
  }

  /**
   * Record a customer view/click event asynchronously (fire-and-forget). The
   * window id is resolved here — at the moment the event occurred — so a slow
   * worker never attributes an event to a later window. Rows are persisted and
   * deduped per (sessionToken, windowId, offerId) by the worker.
   */
  async recordViewOrClick(
    eventType: RotatorEventType,
    clusterId: string,
    offerId: string,
    opts?: {
      customerId?: string | null;
      sessionToken?: string | null;
      windowId?: number | null;
    },
  ): Promise<void> {
    if (
      eventType !== RotatorEventType.VIEW &&
      eventType !== RotatorEventType.CLICK
    ) {
      this.logger.warn(
        `Ignoring unexpected rotator event type "${eventType}" — only view/click are accepted here.`,
      );
      return;
    }
    try {
      let windowId = opts?.windowId ?? null;
      if (windowId == null) {
        const global = await this.eligibility.getGlobalConfig();
        windowId = rotationWindowId(Date.now(), global.windowSeconds);
      }

      await this.refreshQueue.add(
        'record-view-click',
        {
          eventType,
          clusterId,
          offerId,
          windowId,
          customerId: opts?.customerId ?? null,
          sessionToken: opts?.sessionToken ?? null,
        } satisfies RotatorViewClickJobData,
        {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2_000 },
        },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${eventType} event for cluster ${clusterId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Persist a single view/click event. Called by the worker. Idempotent per
   * (sessionToken, windowId, offerId) when a session token is present.
   */
  async persistViewOrClick(job: RotatorViewClickJobData): Promise<void> {
    const {
      eventType,
      clusterId,
      offerId,
      windowId,
      customerId,
      sessionToken,
    } = job;

    if (sessionToken) {
      const existing = await this.impressionRepository.findOne({
        where: {
          clusterId,
          offerId,
          windowId: String(windowId),
          eventType,
          sessionToken,
        },
        select: ['id'],
      });
      if (existing) return;
    }

    await this.impressionRepository.save(
      this.impressionRepository.create({
        clusterId,
        offerId,
        windowId: String(windowId),
        eventType,
        customerId: customerId ?? null,
        sessionToken: sessionToken ?? null,
      }),
    );
  }

  // ------------------------------------------------------------------
  // Aggregation
  // ------------------------------------------------------------------

  async getClusterSummary(clusterId: string, days = 30) {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
      select: ['id', 'scanCount'],
    });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const impressions = await this.impressionRepository.count({
      where: { clusterId, createdAt: Between(since, new Date()) },
    });
    const views = await this.impressionRepository.count({
      where: {
        clusterId,
        eventType: RotatorEventType.VIEW,
        createdAt: Between(since, new Date()),
      },
    });
    const clicks = await this.impressionRepository.count({
      where: {
        clusterId,
        eventType: RotatorEventType.CLICK,
        createdAt: Between(since, new Date()),
      },
    });

    // Unique people = DISTINCT (sessionToken || customerId) in SQL. Matches the
    // per-offer reach semantics below; fully-anonymous rows (neither token nor
    // customer) contribute nothing, and the count is computed in the DB rather
    // than loading every row into memory.
    const uniquePeopleRow = await this.impressionRepository
      .createQueryBuilder('i')
      .select(
        'COUNT(DISTINCT COALESCE(i.sessionToken, i.customerId))',
        'uniquePeople',
      )
      .where('i.clusterId = :clusterId', { clusterId })
      .andWhere('i.createdAt >= :since', { since })
      .getRawOne<{ uniquePeople: string }>();
    const uniquePeople = Number(uniquePeopleRow?.uniquePeople ?? 0);

    const redemptions = await this.claimRepository
      .createQueryBuilder('c')
      .innerJoin('c.offer', 'offer')
      .innerJoin('offer.branch', 'branch')
      .where('branch.clusterId = :clusterId', { clusterId })
      .andWhere('c.status = :status', {
        status: CatalogueOfferClaimStatus.REDEEMED,
      })
      .andWhere('c.createdAt >= :since', { since })
      .getCount();

    return {
      clusterId,
      days,
      // Lifetime scan count. No per-scan history exists, so unlike the other
      // counters below this is NOT scoped to the requested `days` window.
      lifetimeScans: cluster.scanCount,
      uniquePeople,
      impressions,
      views,
      clicks,
      redemptions,
    };
  }

  async getOfferAnalytics(clusterId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.impressionRepository
      .createQueryBuilder('i')
      .select('i.offerId', 'offerId')
      .addSelect(
        "COUNT(*) FILTER (WHERE i.eventType = 'impression')",
        'impressions',
      )
      .addSelect("COUNT(*) FILTER (WHERE i.eventType = 'view')", 'views')
      .addSelect("COUNT(*) FILTER (WHERE i.eventType = 'click')", 'clicks')
      .addSelect(
        'COUNT(DISTINCT COALESCE(i.sessionToken, i.customerId))',
        'reach',
      )
      .where('i.clusterId = :clusterId', { clusterId })
      .andWhere('i.createdAt >= :since', { since })
      .groupBy('i.offerId')
      .getRawMany<{
        offerId: string;
        impressions: string;
        views: string;
        clicks: string;
        reach: string;
      }>();

    const offerIds = rows.map((r) => r.offerId);
    const offers = offerIds.length
      ? await this.offerRepository.find({
          where: { id: In(offerIds) },
          select: ['id', 'name'],
        })
      : [];
    const offerName = new Map(offers.map((o) => [o.id, o.name]));

    const redemptionRows = offerIds.length
      ? await this.claimRepository
          .createQueryBuilder('c')
          .select('c.offerId', 'offerId')
          .addSelect('COUNT(c.id)', 'redemptions')
          .where('c.offerId IN (:...offerIds)', { offerIds })
          .andWhere('c.status = :status', {
            status: CatalogueOfferClaimStatus.REDEEMED,
          })
          .andWhere('c.createdAt >= :since', { since })
          .groupBy('c.offerId')
          .getRawMany<{ offerId: string; redemptions: string }>()
      : [];
    const redemptionsByOffer = new Map(
      redemptionRows.map((r) => [r.offerId, parseInt(r.redemptions, 10)]),
    );

    return {
      clusterId,
      days,
      data: rows.map((r) => ({
        offerId: r.offerId,
        name: offerName.get(r.offerId) ?? 'Unknown',
        impressions: parseInt(r.impressions, 10),
        uniqueReach: parseInt(r.reach, 10),
        views: parseInt(r.views, 10),
        clicks: parseInt(r.clicks, 10),
        redemptions: redemptionsByOffer.get(r.offerId) ?? 0,
      })),
    };
  }

  async getWindowHistory(clusterId: string, limit = 50) {
    const records = await this.recordRepository.find({
      where: { clusterId },
      order: { windowStart: 'DESC' },
      take: limit,
    });
    return records.map((r) => ({
      windowId: r.windowId,
      windowStart: r.windowStart,
      windowEnd: r.windowEnd,
      slotCount: r.slotCount,
      offerIds: r.offerIds,
    }));
  }
}
