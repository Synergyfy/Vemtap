import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cluster } from '../clusters/entities/cluster.entity';
import { RotatorRotationRecord } from './entities/rotator-rotation-record.entity';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { FeaturedSlotsMode } from './entities/rotator-config.entity';
import {
  RotatorCacheService,
  ROTATOR_RESULT_TTL_BUFFER,
} from './rotator-cache.service';
import {
  featuredSlotsForDealCount,
  rotationWindowId,
  rotationWindowStart,
  rotationWindowEnd,
} from './rotator.constants';

export interface RotationResult {
  clusterId: string;
  windowId: number;
  windowStart: Date;
  windowEnd: Date;
  slotCount: number;
  featured: string[];
}

@Injectable()
export class RotatorEngineService {
  private readonly logger = new Logger(RotatorEngineService.name);

  constructor(
    @InjectRepository(RotatorRotationRecord)
    private readonly recordRepository: Repository<RotatorRotationRecord>,
    private readonly eligibility: RotatorEligibilityService,
    private readonly cache: RotatorCacheService,
  ) {}

  /**
   * Resolve the featured deal selection for a cluster's current rotation
   * window. Returns the cached result when present (all customers in the same
   * window see the same selection).
   */
  async getCurrentResult(clusterId: string): Promise<RotationResult> {
    const global = await this.eligibility.getGlobalConfig();
    const windowSeconds = global.windowSeconds;

    const now = Date.now();
    const windowId = rotationWindowId(now, windowSeconds);

    const cacheKey = this.cache.resultKey(clusterId, windowId);
    const cached = await this.cache.get<RotationResult>(cacheKey);
    if (cached) return cached;

    const cluster = await this.eligibility.getCluster(clusterId);
    const result = await this.generate(cluster, windowSeconds, windowId, now);
    const ttl =
      rotationWindowEnd(windowId, windowSeconds) -
      now +
      ROTATOR_RESULT_TTL_BUFFER;
    await this.cache.set(cacheKey, result, Math.max(ttl, 5_000));
    return result;
  }

  /**
   * Generate (and record) a rotation result for a given window. Used by both
   * the live path and the admin preview.
   */
  async generate(
    cluster: Cluster,
    windowSeconds: number,
    windowId: number,
    now: number,
    opts?: { record?: boolean; ignoreCache?: boolean },
  ): Promise<RotationResult> {
    const pool = await this.eligibility.getEligiblePool(cluster.id, {
      ignoreCache: opts?.ignoreCache,
      now: new Date(now),
    });

    const [global, clusterConfig] = await Promise.all([
      this.eligibility.getGlobalConfig(),
      this.eligibility.getClusterConfig(cluster.id),
    ]);

    const ordered = await this.eligibility.orderByDistribution(
      pool,
      cluster.id,
      windowId,
      { global, clusterConfig },
    );

    const featuredSlotsMode =
      clusterConfig?.featuredSlotsMode ?? global.featuredSlotsMode;
    const manualSlots =
      featuredSlotsMode === FeaturedSlotsMode.MANUAL
        ? (clusterConfig?.featuredSlotCount ?? global.featuredSlotCount)
        : null;

    const slotCount = featuredSlotsForDealCount(pool.length, manualSlots);
    const selected = ordered.slice(0, slotCount).map((o) => o.offerId);

    const windowStart = new Date(rotationWindowStart(windowId, windowSeconds));
    const windowEnd = new Date(rotationWindowEnd(windowId, windowSeconds));

    const result: RotationResult = {
      clusterId: cluster.id,
      windowId,
      windowStart,
      windowEnd,
      slotCount,
      featured: selected,
    };

    if (opts?.record !== false) {
      await this.persistRecord(cluster.id, result);
    }

    return result;
  }

  /**
   * Admin preview: simulate N consecutive windows from the current one.
   */
  async preview(clusterId: string, windows = 3): Promise<RotationResult[]> {
    const cluster = await this.eligibility.getCluster(clusterId);
    const global = await this.eligibility.getGlobalConfig();
    const windowSeconds = global.windowSeconds;
    const currentWindow = rotationWindowId(Date.now(), windowSeconds);

    const results: RotationResult[] = [];
    for (let i = 0; i < windows; i++) {
      const windowId = currentWindow + i;
      const now = rotationWindowStart(windowId, windowSeconds);
      const result = await this.generate(
        cluster,
        windowSeconds,
        windowId,
        now,
        {
          record: false,
          ignoreCache: true,
        },
      );
      results.push(result);
    }
    return results;
  }

  private async persistRecord(
    clusterId: string,
    result: RotationResult,
  ): Promise<void> {
    try {
      const existing = await this.recordRepository.findOne({
        where: { clusterId, windowId: String(result.windowId) },
        select: ['id'],
      });
      if (existing) return;
      await this.recordRepository.save(
        this.recordRepository.create({
          clusterId,
          windowId: String(result.windowId),
          windowStart: result.windowStart,
          windowEnd: result.windowEnd,
          offerIds: result.featured,
          slotCount: result.slotCount,
        }),
      );
    } catch (err) {
      // The (clusterId, windowId) index is unique; a concurrent first-request
      // may already have recorded this window. That is fine — ignore it.
      if ((err as { code?: string }).code === '23505') return;
      this.logger.warn(
        `Failed to persist rotation record for cluster ${clusterId} window ${result.windowId}: ${(err as Error).message}`,
      );
    }
  }
}
