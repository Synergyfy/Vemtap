import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cluster } from '../clusters/entities/cluster.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { BusinessStatus } from '../businesses/entities/business.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { RotatorClusterOffer } from './entities/rotator-cluster-offer.entity';
import { RotatorDealSchedule } from './entities/rotator-deal-schedule.entity';
import {
  RotatorConfig,
  RotatorMode,
  DeliveryOverride,
  RotatorDistribution,
} from './entities/rotator-config.entity';
import { RotatorClusterConfig } from './entities/rotator-cluster-config.entity';
import { RotatorCacheService, ROTATOR_POOL_TTL } from './rotator-cache.service';

// Global rotator config is a singleton row that only changes via admin
// endpoints (which invalidate this cache). A short TTL avoids a DB read on the
// deals hot path while bounding staleness for out-of-band changes.
const GLOBAL_CONFIG_CACHE_TTL_MS = 30 * 1000;

export interface EligiblePoolOffer {
  offerId: string;
  branchId: string;
  businessId: string;
  branchName: string;
  businessName: string;
  weight: number;
  pinned: boolean;
}

interface OfferCandidate {
  offerId: string;
  branchId: string;
  businessId: string;
  branchName: string;
  businessName: string;
  pinned: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export interface EligibilityExplanation {
  offerId: string;
  eligible: boolean;
  businessActive: boolean;
  subscriptionActive: boolean;
  planHasDiscovery: boolean;
  dealActive: boolean;
  clusterMatch: boolean;
  notExpired: boolean;
  schedule: boolean;
  frequencyEligible: boolean;
  included: boolean;
  manualIncluded: boolean | null;
  manualExcluded: boolean;
  deliveryWeight: number;
  rotation: string;
  mode: string;
  status: 'Eligible' | 'Excluded' | 'Expired' | 'Paused' | 'Scheduled-out';
  reasons: string[];
}

@Injectable()
export class RotatorEligibilityService implements OnModuleInit {
  private globalConfigCache: {
    value: RotatorConfig;
    expiresAt: number;
  } | null = null;

  constructor(
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(RotatorClusterOffer)
    private readonly clusterOfferRepository: Repository<RotatorClusterOffer>,
    @InjectRepository(RotatorDealSchedule)
    private readonly scheduleRepository: Repository<RotatorDealSchedule>,
    @InjectRepository(RotatorConfig)
    private readonly configRepository: Repository<RotatorConfig>,
    @InjectRepository(RotatorClusterConfig)
    private readonly clusterConfigRepository: Repository<RotatorClusterConfig>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly cache: RotatorCacheService,
  ) {}

  async getCluster(clusterId: string): Promise<Cluster> {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
    });
    if (!cluster) throw new NotFoundException('Cluster not found');
    return cluster;
  }

  async onModuleInit(): Promise<void> {
    // Ensure a single global rotator config row exists (singleton). Entity
    // defaults provide the factory values, so a bare create is sufficient.
    await this.ensureGlobalConfigRow();
  }

  /**
   * Return the singleton global config row, creating it on first boot. The
   * database enforces single-row semantics (unique index on a constant), so
   * concurrent replicas racing to create the row are safe: the loser of a
   * unique-violation simply re-reads the winner's row.
   */
  private async ensureGlobalConfigRow(): Promise<RotatorConfig> {
    const rows = await this.configRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (rows[0]) return rows[0];
    try {
      return await this.configRepository.save(this.configRepository.create({}));
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') {
        throw err;
      }
      // Another replica created the singleton first — adopt it.
      const winner = await this.configRepository.find({
        order: { createdAt: 'ASC' },
        take: 1,
      });
      if (winner[0]) return winner[0];
      throw err;
    }
  }

  async getGlobalConfig(): Promise<RotatorConfig> {
    if (
      this.globalConfigCache &&
      this.globalConfigCache.expiresAt > Date.now()
    ) {
      return this.globalConfigCache.value;
    }
    const config = await this.ensureGlobalConfigRow();
    this.globalConfigCache = {
      value: config,
      expiresAt: Date.now() + GLOBAL_CONFIG_CACHE_TTL_MS,
    };
    return config;
  }

  invalidateGlobalConfigCache(): void {
    this.globalConfigCache = null;
  }

  async getClusterConfig(
    clusterId: string,
  ): Promise<RotatorClusterConfig | null> {
    return this.clusterConfigRepository.findOne({ where: { clusterId } });
  }

  /**
   * Build the eligible deal pool for a cluster (Layer 1). In automatic mode all
   * eligible deals are included; in manual mode only the admin-selected
   * `included` deals participate (excluded rows are dropped).
   */
  async getEligiblePool(
    clusterId: string,
    opts?: { ignoreCache?: boolean; now?: Date },
  ): Promise<EligiblePoolOffer[]> {
    if (!opts?.ignoreCache) {
      const cached = await this.cache.get<EligiblePoolOffer[]>(
        this.cache.poolKey(clusterId),
      );
      if (cached) return cached;
    }

    const [clusterConfig, global] = await Promise.all([
      this.getClusterConfig(clusterId),
      this.getGlobalConfig(),
    ]);

    const mode = clusterConfig?.rotationMode ?? global.rotationMode;

    const now = opts?.now ?? new Date();
    const windowEnd = new Date(now.getTime() + global.windowSeconds * 1000);

    const offers = await this.queryEligibleOffers(clusterId, now, windowEnd);

    const scheduleActive = await this.filterScheduleActive(offers, now);

    // Manual rows carry both manual-mode membership and deal-level weight
    // overrides (which apply in automatic mode too).
    const manualRows = await this.clusterOfferRepository.find({
      where: { clusterId },
    });
    const manualById = new Map(manualRows.map((r) => [r.offerId, r]));

    if (mode === RotatorMode.MANUAL) {
      const includedSet = new Set(
        manualRows.filter((r) => r.included).map((r) => r.offerId),
      );
      const excludedSet = new Set(
        manualRows.filter((r) => !r.included).map((r) => r.offerId),
      );
      const filtered = scheduleActive.filter(
        (o) => includedSet.has(o.offerId) && !excludedSet.has(o.offerId),
      );
      const pool = filtered.map((o) =>
        this.toPoolOffer(o, manualById.get(o.offerId)),
      );
      await this.cache.set(
        this.cache.poolKey(clusterId),
        pool,
        ROTATOR_POOL_TTL,
      );
      return pool;
    }

    const pool = scheduleActive.map((o) =>
      this.toPoolOffer(o, manualById.get(o.offerId)),
    );

    await this.cache.set(this.cache.poolKey(clusterId), pool, ROTATOR_POOL_TTL);
    return pool;
  }

  /**
   * Deals with explicit schedule rows only remain in the pool while at least
   * one of their windows is currently active. Deals without schedule rows are
   * always eligible (default 24/7 window).
   */
  private async filterScheduleActive(
    offers: OfferCandidate[],
    now: Date,
  ): Promise<OfferCandidate[]> {
    if (offers.length === 0) return offers;
    const offerIds = offers.map((o) => o.offerId);
    const rows = await this.scheduleRepository.find({
      where: { offerId: In(offerIds) },
    });
    if (rows.length === 0) return offers;

    const activeOfferIds = new Set<string>();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const dow = now.getDay();

    for (const row of rows) {
      if (activeOfferIds.has(row.offerId)) continue;
      if (row.dayOfWeek != null && row.dayOfWeek !== dow) continue;
      if (row.startDate && now < row.startDate) continue;
      if (row.endDate && now > row.endDate) continue;

      const start = this.parseTime(row.startTime);
      const end = this.parseTime(row.endTime);
      if (start == null || end == null || start === end) {
        activeOfferIds.add(row.offerId);
        continue;
      }
      if (start < end) {
        if (nowMinutes >= start && nowMinutes < end)
          activeOfferIds.add(row.offerId);
      } else if (nowMinutes >= start || nowMinutes < end) {
        activeOfferIds.add(row.offerId);
      }
    }

    const scheduleByOffer = new Map<string, boolean>();
    for (const id of offerIds) scheduleByOffer.set(id, activeOfferIds.has(id));

    return offers.filter((o) => scheduleByOffer.get(o.offerId));
  }

  private toPoolOffer(
    o: {
      offerId: string;
      branchId: string;
      businessId: string;
      branchName: string;
      businessName: string;
      pinned: boolean;
    },
    row?: RotatorClusterOffer | null,
  ): EligiblePoolOffer {
    let weight = 1;
    if (
      row?.deliveryOverride === DeliveryOverride.MANUAL &&
      row.weight != null
    ) {
      weight = Number(row.weight);
    }
    return {
      offerId: o.offerId,
      branchId: o.branchId,
      businessId: o.businessId,
      branchName: o.branchName,
      businessName: o.businessName,
      weight,
      pinned: o.pinned,
    };
  }

  /**
   * Base candidate query: active offers from member branches that opted into
   * the discovery network, not expired, and valid beyond the current window.
   */
  private async queryEligibleOffers(
    clusterId: string,
    now: Date,
    windowEnd: Date,
  ): Promise<OfferCandidate[]> {
    const rows = await this.offerRepository
      .createQueryBuilder('offer')
      .select('offer.id', 'offerId')
      .addSelect('offer.branchId', 'branchId')
      .addSelect('offer.businessId', 'businessId')
      .addSelect('offer.startDate', 'startDate')
      .addSelect('offer.endDate', 'endDate')
      .addSelect('branch.name', 'branchName')
      .addSelect('business.name', 'businessName')
      .innerJoin('offer.branch', 'branch')
      .innerJoin('offer.business', 'business')
      .where('branch.clusterId = :clusterId', { clusterId })
      .andWhere('offer.status = :status', {
        status: CatalogueOfferStatus.ACTIVE,
      })
      .andWhere('business.status = :businessStatus', {
        businessStatus: BusinessStatus.ACTIVE,
      })
      .andWhere('branch.isActive = :branchActive', { branchActive: true })
      .andWhere('branch.joinDiscoveryNetwork = :joinDiscoveryNetwork', {
        joinDiscoveryNetwork: true,
      })
      .andWhere('branch.allowPromotions = :allowPromotions', {
        allowPromotions: true,
      })
      .andWhere('(offer.startDate IS NULL OR offer.startDate <= :now)', { now })
      .andWhere('(offer.endDate IS NULL OR offer.endDate > :windowEnd)', {
        windowEnd,
      })
      // Discovery gate: same subscription/plan filter as the cluster deals
      // feed (see ClustersService.buildOfferQuery) so the rotator's eligible
      // pool and the public feed agree on which businesses may be featured.
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM "subscriptions" sub
          INNER JOIN "plans" plan ON plan."id" = sub."planId"
          WHERE sub."businessId" = business."id"
            AND sub."deletedAt" IS NULL
            AND sub."status" IN ('${SubscriptionStatus.ACTIVE}', '${SubscriptionStatus.TRIAL}')
            AND (sub."endDate" IS NULL OR sub."endDate" + INTERVAL '24 hours' > NOW())
            AND plan."discoveryEnabled" = true
        )`,
      )
      .leftJoin(
        (qb) =>
          qb
            .select('co."clusterId"', 'clusterId')
            .addSelect('co."offerId"', 'offerId')
            .from('cluster_offers', 'co')
            .where('co."isPinned" = true')
            .andWhere('co."deletedAt" IS NULL'),
        'pinned',
        'pinned."offerId" = offer.id AND pinned."clusterId" = :clusterId',
        { clusterId },
      )
      .addSelect(
        'CASE WHEN pinned."offerId" IS NOT NULL THEN true ELSE false END',
        'pinned',
      )
      .orderBy('offer.createdAt', 'DESC')
      .getRawMany<{
        offerId: string;
        branchId: string;
        businessId: string;
        branchName: string;
        businessName: string;
        pinned: boolean;
        startDate: Date | null;
        endDate: Date | null;
      }>();

    return rows.map((r) => ({
      offerId: r.offerId,
      branchId: r.branchId,
      businessId: r.businessId,
      branchName: r.branchName,
      businessName: r.businessName,
      pinned: !!r.pinned,
      startDate: r.startDate,
      endDate: r.endDate,
    }));
  }

  /**
   * Deterministic balanced lead-rotation: which member branch leads rotates
   * every window (via stableHash(clusterId + windowId) % memberCount).
   * Callers on the hot path may pass the already-resolved configs to avoid
   * re-reading them here.
   */
  async orderByDistribution(
    offers: EligiblePoolOffer[],
    clusterId: string,
    windowId: number,
    preloaded?: {
      global?: RotatorConfig;
      clusterConfig?: RotatorClusterConfig | null;
    },
  ): Promise<EligiblePoolOffer[]> {
    let clusterConfig: RotatorClusterConfig | null = null;
    let global: RotatorConfig;
    if (preloaded?.global) {
      global = preloaded.global;
      clusterConfig = preloaded.clusterConfig ?? null;
    } else {
      [clusterConfig, global] = await Promise.all([
        this.getClusterConfig(clusterId),
        this.getGlobalConfig(),
      ]);
    }
    const distribution = clusterConfig?.distribution ?? global.distribution;

    // Pinned deals always lead (oldest pin first → stable via insertion order).
    const pinned = offers.filter((o) => o.pinned);
    const rest = offers.filter((o) => !o.pinned);

    if (distribution === RotatorDistribution.WEIGHTED) {
      const ordered = [...rest].sort((a, b) => {
        const wd = b.weight - a.weight;
        if (wd !== 0) return wd;
        return this.stableHash(a.offerId) - this.stableHash(b.offerId);
      });
      return [...pinned, ...ordered];
    }

    if (distribution === RotatorDistribution.SCHEDULED) {
      // Schedule-eligible offers are already the pool; rotate fairly.
      const ordered = this.balancedOrder(rest, clusterId, windowId);
      return [...pinned, ...ordered];
    }

    if (distribution === RotatorDistribution.SMART) {
      // Reserved for future AI mode — fall back to balanced for now.
      const ordered = this.balancedOrder(rest, clusterId, windowId);
      return [...pinned, ...ordered];
    }

    const ordered = this.balancedOrder(rest, clusterId, windowId);
    return [...pinned, ...ordered];
  }

  private balancedOrder(
    offers: EligiblePoolOffer[],
    clusterId: string,
    windowId: number,
  ): EligiblePoolOffer[] {
    if (offers.length === 0) return [];
    const branches = [...new Set(offers.map((o) => o.branchId))].sort();
    const memberCount = branches.length;
    const offset = this.stableHash(`${clusterId}:${windowId}`) % memberCount;
    const branchRank = new Map<string, number>();
    branches.forEach((branchId, index) => {
      branchRank.set(branchId, (index + memberCount - offset) % memberCount);
    });
    return [...offers].sort((a, b) => {
      const rankDiff =
        branchRank.get(a.branchId)! - branchRank.get(b.branchId)!;
      if (rankDiff !== 0) return rankDiff;
      return a.branchName.localeCompare(b.branchName);
    });
  }

  stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  /**
   * "Why is this deal showing?" — per-condition explanation for admin.
   */
  async explain(
    clusterId: string,
    offerId: string,
  ): Promise<EligibilityExplanation> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['branch', 'business'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const now = new Date();

    // The "not expired" check must match the deals feed, which treats a deal
    // as expired only after the current rotation window ends — not at the
    // fixed 60s buffer used previously.
    const [global, clusterConfig] = await Promise.all([
      this.getGlobalConfig(),
      this.getClusterConfig(clusterId),
    ]);
    const windowEnd = new Date(now.getTime() + global.windowSeconds * 1000);

    const businessActive = offer.business?.status === BusinessStatus.ACTIVE;
    const dealActive = offer.status === CatalogueOfferStatus.ACTIVE;
    const clusterMatch =
      !!offer.branch?.clusterId && offer.branch.clusterId === clusterId;
    const notExpired =
      offer.endDate == null || offer.endDate.getTime() > windowEnd.getTime();
    const withinStart = offer.startDate == null || offer.startDate <= now;

    const subscriptionActive =
      !!offer.businessId &&
      (await this.businessHasDiscoverySubscription(offer.businessId, now));
    const planHasDiscovery = subscriptionActive;

    const schedule = await this.isScheduleActive(offerId, now);

    const mode = clusterConfig?.rotationMode ?? global.rotationMode;

    let manualIncluded: boolean | null = null;
    let manualExcluded = false;
    let weight = 1;
    const manualRow = await this.clusterOfferRepository.findOne({
      where: { clusterId, offerId },
    });
    if (manualRow) {
      manualIncluded = manualRow.included;
      manualExcluded = !manualRow.included;
      if (
        manualRow.deliveryOverride === DeliveryOverride.MANUAL &&
        manualRow.weight != null
      ) {
        weight = Number(manualRow.weight);
      }
    }

    const reasons: string[] = [];
    if (!businessActive) reasons.push('Business is not active');
    if (!subscriptionActive)
      reasons.push(
        'Business has no active subscription with the Discovery plan',
      );
    if (!dealActive) reasons.push('Deal is not active');
    if (!clusterMatch) reasons.push('Deal does not belong to this cluster');
    if (!withinStart) reasons.push('Deal has not started yet');
    if (!notExpired) reasons.push('Deal has expired');
    if (!schedule) reasons.push('Deal is outside its schedule window');
    if (mode === RotatorMode.MANUAL) {
      if (manualIncluded === false) reasons.push('Manually excluded by admin');
      if (manualIncluded == null) reasons.push('Not included in manual mode');
    }

    const eligible =
      businessActive &&
      subscriptionActive &&
      planHasDiscovery &&
      dealActive &&
      clusterMatch &&
      withinStart &&
      notExpired &&
      schedule &&
      (mode === RotatorMode.AUTOMATIC ||
        (manualIncluded === true && !manualExcluded));

    let status: EligibilityExplanation['status'] = 'Eligible';
    if (!eligible) {
      if (reasons.some((r) => r.includes('expired'))) status = 'Expired';
      else if (reasons.some((r) => r.includes('not active'))) status = 'Paused';
      else if (reasons.some((r) => r.includes('schedule')))
        status = 'Scheduled-out';
      else status = 'Excluded';
    }

    return {
      offerId,
      eligible,
      businessActive,
      subscriptionActive,
      planHasDiscovery,
      dealActive,
      clusterMatch,
      notExpired,
      schedule,
      frequencyEligible: true,
      included: eligible,
      manualIncluded,
      manualExcluded,
      deliveryWeight: weight,
      rotation: clusterConfig?.distribution ?? global.distribution,
      mode,
      status,
      reasons,
    };
  }

  /**
   * Time-of-day window check. Windows may cross midnight. Deals with no
   * schedule rows are always active.
   */
  private async isScheduleActive(offerId: string, now: Date): Promise<boolean> {
    const rows = await this.scheduleRepository.find({ where: { offerId } });
    if (rows.length === 0) return true;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const dow = now.getDay();

    for (const row of rows) {
      if (row.dayOfWeek != null && row.dayOfWeek !== dow) continue;
      if (row.startDate && now < row.startDate) continue;
      if (row.endDate && now > row.endDate) continue;

      const start = this.parseTime(row.startTime);
      const end = this.parseTime(row.endTime);
      if (start == null || end == null) {
        // Missing/invalid times on an explicit row → treat as active.
        return true;
      }
      if (start === end) return true;
      if (start < end) {
        if (nowMinutes >= start && nowMinutes < end) return true;
      } else {
        // Crosses midnight: e.g. 22:00 → 02:00.
        if (nowMinutes >= start || nowMinutes < end) return true;
      }
    }
    return false;
  }

  private parseTime(time?: string | null): number | null {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Whether a business currently has a valid subscription whose plan includes
   * the Discovery Network. Mirrors the SQL gate used by the pool query and the
   * cluster deals feed: status active/trial, not past endDate beyond the 24h
   * renewal grace, and plan.discoveryEnabled = true.
   */
  private async businessHasDiscoverySubscription(
    businessId: string,
    now: Date,
  ): Promise<boolean> {
    const sub = await this.subscriptionRepository.findOne({
      where: {
        businessId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
    if (!sub) return false;
    if (sub.endDate) {
      const grace = new Date(sub.endDate);
      grace.setHours(grace.getHours() + 24);
      if (grace <= now) return false;
    }
    return sub.plan?.discoveryEnabled === true;
  }

  async invalidatePool(clusterId: string): Promise<void> {
    await this.cache.invalidateCluster(clusterId);
  }
}
