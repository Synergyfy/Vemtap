import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cluster } from '../clusters/entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BusinessStatus } from '../businesses/entities/business.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import {
  RotatorConfig,
  RotatorMode,
  RotatorDistribution,
  FeaturedSlotsMode,
} from './entities/rotator-config.entity';
import { RotatorClusterConfig } from './entities/rotator-cluster-config.entity';
import { RotatorClusterOffer } from './entities/rotator-cluster-offer.entity';
import { RotatorDealSchedule } from './entities/rotator-deal-schedule.entity';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { RotatorEngineService, RotationResult } from './rotator-engine.service';
import { RotatorCacheService } from './rotator-cache.service';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import {
  RecordClusterEventDto,
  ClusterEventType,
  UpdateRotatorGlobalConfigDto,
  UpdateRotatorClusterConfigDto,
  SetClusterOfferIncludedDto,
  SetClusterOfferDeliveryDto,
  UpsertDealScheduleDto,
} from './dto/rotator.dto';
import { RotatorEventType } from './entities/rotator-impression.entity';
import { rotationWindowId } from './rotator.constants';

export interface MergedRotatorConfig {
  rotationMode: RotatorMode;
  distribution: RotatorDistribution;
  featuredSlotsMode: FeaturedSlotsMode;
  featuredSlotCount: number | null;
  windowSeconds: number;
  frequencyWindowHours: number;
  isOverridden: boolean;
}

@Injectable()
export class RotatorService {
  private readonly logger = new Logger(RotatorService.name);

  constructor(
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(RotatorConfig)
    private readonly configRepository: Repository<RotatorConfig>,
    @InjectRepository(RotatorClusterConfig)
    private readonly clusterConfigRepository: Repository<RotatorClusterConfig>,
    @InjectRepository(RotatorClusterOffer)
    private readonly clusterOfferRepository: Repository<RotatorClusterOffer>,
    @InjectRepository(RotatorDealSchedule)
    private readonly scheduleRepository: Repository<RotatorDealSchedule>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly eligibility: RotatorEligibilityService,
    private readonly engine: RotatorEngineService,
    private readonly cache: RotatorCacheService,
    private readonly analytics: RotatorAnalyticsService,
  ) {}

  async getCurrentResult(clusterId: string): Promise<RotationResult> {
    return this.engine.getCurrentResult(clusterId);
  }

  /**
   * Record a customer view/click event against a cluster deal (public, no
   * auth). The session token (x-visit-session-token) drives unique-reach
   * analytics. The deal must belong to the cluster — events are only stored
   * for the cluster the customer is currently discovering.
   */
  async recordClusterEvent(
    uniqueCode: string,
    dto: RecordClusterEventDto,
    sessionToken?: string | null,
  ): Promise<{ success: boolean; offerId: string }> {
    const cluster = await this.clusterRepository.findOne({
      where: { uniqueCode },
      select: ['id'],
    });
    if (!cluster) {
      throw new NotFoundException(
        `Cluster with uniqueCode "${uniqueCode}" not found`,
      );
    }

    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId },
      relations: ['branch', 'business'],
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        branch: {
          id: true,
          clusterId: true,
          isActive: true,
          joinDiscoveryNetwork: true,
          allowPromotions: true,
        },
        business: { id: true, status: true },
      },
    });
    if (!offer) throw new NotFoundException('Deal not found');
    if (offer.branch?.clusterId !== cluster.id) {
      throw new BadRequestException('Deal does not belong to this cluster');
    }
    if (offer.status !== CatalogueOfferStatus.ACTIVE) {
      throw new BadRequestException('Deal is not active');
    }
    if (offer.startDate && offer.startDate.getTime() > Date.now()) {
      throw new BadRequestException('Deal has not started yet');
    }
    if (offer.endDate && offer.endDate.getTime() <= Date.now()) {
      throw new BadRequestException('Deal has expired');
    }
    if (offer.business?.status !== BusinessStatus.ACTIVE) {
      throw new BadRequestException('Business is not active');
    }
    if (
      !offer.branch?.isActive ||
      !offer.branch.joinDiscoveryNetwork ||
      !offer.branch.allowPromotions
    ) {
      throw new BadRequestException('Deal is not currently discoverable');
    }

    // The client may echo the window id it saw in the deals feed, but it is
    // never trusted: attributes to a window far from the current one would let
    // a caller pollute analytics. Only accept windows within ±1 of now and
    // fall back to the server-resolved current window otherwise.
    let windowId: number | null = dto.windowId ?? null;
    if (windowId != null) {
      const global = await this.eligibility.getGlobalConfig();
      const currentWindow = rotationWindowId(Date.now(), global.windowSeconds);
      if (Math.abs(windowId - currentWindow) > 1) {
        windowId = null;
      }
    }

    await this.analytics.recordViewOrClick(
      dto.type === ClusterEventType.CLICK
        ? RotatorEventType.CLICK
        : RotatorEventType.VIEW,
      cluster.id,
      dto.offerId,
      {
        sessionToken: sessionToken ?? null,
        windowId,
      },
    );

    return { success: true, offerId: dto.offerId };
  }

  async preview(clusterId: string, windows = 3): Promise<RotationResult[]> {
    return this.engine.preview(clusterId, windows);
  }

  async explain(clusterId: string, offerId: string) {
    return this.eligibility.explain(clusterId, offerId);
  }

  async eligibilitySummary(clusterId: string) {
    await this.eligibility.getCluster(clusterId);
    const pool = await this.eligibility.getEligiblePool(clusterId, {
      ignoreCache: true,
    });
    const [global, clusterConfig] = await Promise.all([
      this.eligibility.getGlobalConfig(),
      this.eligibility.getClusterConfig(clusterId),
    ]);
    const mode = clusterConfig?.rotationMode ?? global.rotationMode;

    let included: string[] = [];
    let excluded: string[] = [];
    if (mode === RotatorMode.MANUAL) {
      const rows = await this.clusterOfferRepository.find({
        where: { clusterId },
      });
      included = rows.filter((r) => r.included).map((r) => r.offerId);
      excluded = rows.filter((r) => !r.included).map((r) => r.offerId);
    }

    return {
      automatic: mode === RotatorMode.AUTOMATIC,
      manual: mode === RotatorMode.MANUAL,
      totalEligible: pool.length,
      included,
      excluded,
      mode,
    };
  }

  // ------------------------------------------------------------------
  // Config
  // ------------------------------------------------------------------

  async getGlobalConfig() {
    return this.eligibility.getGlobalConfig();
  }

  async updateGlobalConfig(dto: UpdateRotatorGlobalConfigDto) {
    let config = await this.eligibility.getGlobalConfig();
    if (dto.rotationMode !== undefined) config.rotationMode = dto.rotationMode;
    if (dto.distribution !== undefined) config.distribution = dto.distribution;
    if (dto.featuredSlotsMode !== undefined) {
      config.featuredSlotsMode = dto.featuredSlotsMode;
    }
    if (dto.featuredSlotCount !== undefined) {
      config.featuredSlotCount = dto.featuredSlotCount;
    }
    if (dto.windowSeconds !== undefined && dto.windowSeconds >= 10) {
      config.windowSeconds = dto.windowSeconds;
    }
    if (dto.frequencyWindowHours !== undefined) {
      config.frequencyWindowHours = dto.frequencyWindowHours;
    }
    config = await this.configRepository.save(config);
    this.eligibility.invalidateGlobalConfigCache();
    await this.invalidateAllClusters();
    return config;
  }

  async resetGlobalConfig() {
    const config = await this.eligibility.getGlobalConfig();
    config.rotationMode = RotatorMode.AUTOMATIC;
    config.distribution = RotatorDistribution.BALANCED;
    config.featuredSlotsMode = FeaturedSlotsMode.AUTOMATIC;
    config.featuredSlotCount = null;
    config.windowSeconds = 60;
    config.frequencyWindowHours = 24;
    await this.configRepository.save(config);
    this.eligibility.invalidateGlobalConfigCache();
    await this.invalidateAllClusters();
    return config;
  }

  async getClusterConfig(clusterId: string): Promise<MergedRotatorConfig> {
    await this.eligibility.getCluster(clusterId);
    const [global, clusterConfig] = await Promise.all([
      this.eligibility.getGlobalConfig(),
      this.eligibility.getClusterConfig(clusterId),
    ]);
    return this.mergeConfig(global, clusterConfig);
  }

  async updateClusterConfig(
    clusterId: string,
    dto: UpdateRotatorClusterConfigDto,
  ) {
    await this.eligibility.getCluster(clusterId);

    if (dto.reset) {
      return this.resetClusterConfig(clusterId);
    }

    let row = await this.eligibility.getClusterConfig(clusterId);
    const global = await this.eligibility.getGlobalConfig();
    if (!row) {
      row = this.clusterConfigRepository.create({
        clusterId,
        isOverridden: false,
      });
    }

    if (dto.rotationMode !== undefined) row.rotationMode = dto.rotationMode;
    if (dto.distribution !== undefined) row.distribution = dto.distribution;
    if (dto.featuredSlotsMode !== undefined)
      row.featuredSlotsMode = dto.featuredSlotsMode;
    if (dto.featuredSlotCount !== undefined) {
      row.featuredSlotCount = dto.featuredSlotCount;
    }

    const merged = this.mergeConfig(global, row);
    row.isOverridden =
      merged.rotationMode !== global.rotationMode ||
      merged.distribution !== global.distribution ||
      merged.featuredSlotsMode !== global.featuredSlotsMode ||
      merged.featuredSlotCount !== global.featuredSlotCount;

    row = await this.clusterConfigRepository.save(row);
    await this.cache.invalidateCluster(clusterId);
    return this.mergeConfig(global, row);
  }

  async resetClusterConfig(clusterId: string) {
    const row = await this.eligibility.getClusterConfig(clusterId);
    if (row) {
      row.rotationMode = null;
      row.distribution = null;
      row.featuredSlotsMode = null;
      row.featuredSlotCount = null;
      row.isOverridden = false;
      row.resetAt = new Date();
      await this.clusterConfigRepository.save(row);
    }
    await this.clusterOfferRepository.delete({ clusterId });
    await this.cache.invalidateCluster(clusterId);
    return this.getClusterConfig(clusterId);
  }

  private mergeConfig(
    global: RotatorConfig,
    clusterConfig: RotatorClusterConfig | null,
  ): MergedRotatorConfig {
    return {
      rotationMode: clusterConfig?.rotationMode ?? global.rotationMode,
      distribution: clusterConfig?.distribution ?? global.distribution,
      featuredSlotsMode:
        clusterConfig?.featuredSlotsMode ?? global.featuredSlotsMode,
      featuredSlotCount:
        clusterConfig?.featuredSlotCount ?? global.featuredSlotCount,
      windowSeconds: global.windowSeconds,
      frequencyWindowHours: global.frequencyWindowHours,
      isOverridden: clusterConfig?.isOverridden ?? false,
    };
  }

  // ------------------------------------------------------------------
  // Manual membership & weights
  // ------------------------------------------------------------------

  async setClusterOffer(
    clusterId: string,
    offerId: string,
    dto: SetClusterOfferIncludedDto,
    adminId: string,
  ) {
    await this.eligibility.getCluster(clusterId);
    let row = await this.clusterOfferRepository.findOne({
      where: { clusterId, offerId },
    });
    if (!row) {
      row = this.clusterOfferRepository.create({ clusterId, offerId });
    }
    row.included = dto.included;
    row.setBy = adminId;
    await this.clusterOfferRepository.save(row);
    await this.cache.invalidateCluster(clusterId);
    return { clusterId, offerId, included: dto.included };
  }

  async setOfferDelivery(
    clusterId: string,
    offerId: string,
    dto: SetClusterOfferDeliveryDto,
    adminId: string,
  ) {
    await this.eligibility.getCluster(clusterId);
    let row = await this.clusterOfferRepository.findOne({
      where: { clusterId, offerId },
    });
    if (!row) {
      row = this.clusterOfferRepository.create({
        clusterId,
        offerId,
        included: true,
      });
    }
    row.deliveryOverride = dto.deliveryOverride;
    if (dto.weight != null) {
      if (dto.weight < 1 || dto.weight > 5) {
        throw new BadRequestException('Weight must be between 1 and 5');
      }
      row.weight = dto.weight;
    }
    row.setBy = adminId;
    await this.clusterOfferRepository.save(row);
    await this.cache.invalidateCluster(clusterId);
    return {
      clusterId,
      offerId,
      deliveryOverride: dto.deliveryOverride,
      weight: row.weight,
    };
  }

  // ------------------------------------------------------------------
  // Schedules
  // ------------------------------------------------------------------

  async listSchedules(offerId: string) {
    return this.scheduleRepository.find({ where: { offerId } });
  }

  async upsertSchedule(offerId: string, dto: UpsertDealScheduleDto) {
    let row: RotatorDealSchedule;
    if (dto.id) {
      const existing = await this.scheduleRepository.findOne({
        where: { id: dto.id },
      });
      if (!existing) throw new NotFoundException('Schedule not found');
      row = existing;
    } else {
      row = this.scheduleRepository.create({ offerId });
    }
    if (dto.dayOfWeek !== undefined) row.dayOfWeek = dto.dayOfWeek ?? null;
    if (dto.startTime !== undefined) row.startTime = dto.startTime ?? null;
    if (dto.endTime !== undefined) row.endTime = dto.endTime ?? null;
    if (dto.startDate !== undefined)
      row.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      row.endDate = dto.endDate ? new Date(dto.endDate) : null;
    row = await this.scheduleRepository.save(row);
    const clusterId = await this.clusterIdForOffer(offerId);
    if (clusterId) await this.cache.invalidateCluster(clusterId);
    return row;
  }

  async deleteSchedule(id: string) {
    const row = await this.scheduleRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Schedule not found');
    await this.scheduleRepository.remove(row);
    const clusterId = await this.clusterIdForOffer(row.offerId);
    if (clusterId) await this.cache.invalidateCluster(clusterId);
    return { success: true };
  }

  private async clusterIdForOffer(offerId: string): Promise<string | null> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      select: ['branchId'],
    });
    if (!offer?.branchId) return null;
    const branch = await this.branchRepository.findOne({
      where: { id: offer.branchId },
      select: ['id', 'clusterId'],
    });
    return branch?.clusterId ?? null;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async invalidateAllClusters(): Promise<void> {
    try {
      const batchSize = 1000;
      let skip = 0;
      for (;;) {
        const clusters = await this.clusterRepository.find({
          select: ['id'],
          order: { id: 'ASC' },
          skip,
          take: batchSize,
        });
        if (clusters.length === 0) break;
        await Promise.all(
          clusters.map((c) => this.cache.invalidateCluster(c.id)),
        );
        if (clusters.length < batchSize) break;
        skip += batchSize;
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate all rotator caches after global config change: ${(err as Error).message}`,
      );
    }
  }
}
