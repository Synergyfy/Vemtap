import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cluster } from './entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from '../catalogue/entities/catalogue-offer-claim.entity';
import {
  ClusterCacheService,
  CLUSTER_DEALS_TTL,
  CLUSTER_CONTEXT_TTL,
} from './cluster-cache.service';
import {
  ClusterDealsQueryDto,
  ClusterDealsSortBy,
} from './dto/cluster-deals-query.dto';
import {
  CreateClusterDto,
  UpdateClusterDto,
  AdminClusterQueryDto,
  AutoAssignClustersDto,
} from './dto/cluster.dto';

const ROTATION_BUCKET_MS = 15 * 60 * 1000;
const MAX_OFFERS_FETCH = 1000;

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

@Injectable()
export class ClustersService {
  private readonly logger = new Logger(ClustersService.name);

  constructor(
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    private readonly clusterCache: ClusterCacheService,
    private readonly configService: ConfigService,
  ) {}

  // ------------------------------------------------------------------
  // Public: scan context
  // ------------------------------------------------------------------
  async getContext(uniqueCode: string) {
    const cacheKey = `cluster:context:${uniqueCode}`;
    const cached = await this.clusterCache.get<{
      cluster: any;
      branches: any[];
      qrActive: boolean;
    }>(cacheKey);
    if (cached) {
      if (cached.qrActive) {
        await this.incrementScan(uniqueCode);
      }
      return cached;
    }

    const cluster = await this.clusterRepository.findOne({
      where: { uniqueCode },
    });
    if (!cluster) {
      throw new NotFoundException(
        `Cluster with uniqueCode "${uniqueCode}" not found`,
      );
    }

    const branches = await this.branchRepository.find({
      where: { clusterId: cluster.id, isActive: true },
      select: [
        'id',
        'name',
        'username',
        'uniqueCode',
        'logoUrl',
        'address',
        'city',
        'state',
        'latitude',
        'longitude',
      ],
    });

    const qrActive = cluster.isActive && cluster.qrIsActive;

    if (qrActive) {
      await this.incrementScan(uniqueCode);
    }

    const result = {
      qrActive,
      cluster: {
        id: cluster.id,
        name: cluster.name,
        uniqueCode: cluster.uniqueCode,
        description: cluster.description,
        qrUrl: this.buildQrUrl(cluster.uniqueCode),
        branchCount: branches.length,
        radiusMeters: cluster.radiusMeters,
      },
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.username || b.uniqueCode,
        logoUrl: b.logoUrl,
        address: b.address,
        city: b.city,
        state: b.state,
        latitude: b.latitude,
        longitude: b.longitude,
      })),
    };

    await this.clusterCache.set(cacheKey, result, CLUSTER_CONTEXT_TTL);
    return result;
  }

  // ------------------------------------------------------------------
  // Public: cluster deals feed (filters + fair rotation + sorting)
  // ------------------------------------------------------------------
  async getClusterDeals(uniqueCode: string, query: ClusterDealsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const sortBy = query.sortBy ?? ClusterDealsSortBy.FAIR;

    const cluster = await this.clusterRepository.findOne({
      where: { uniqueCode },
    });
    if (!cluster) {
      throw new NotFoundException(
        `Cluster with uniqueCode "${uniqueCode}" not found`,
      );
    }

    const active = cluster.isActive && cluster.qrIsActive;
    if (!active) {
      return {
        active: false,
        reason: cluster.qrIsActive ? 'cluster_inactive' : 'qr_deactivated',
        data: [],
        total: 0,
        page,
        limit,
        sortBy,
        reference: this.referenceFromCluster(cluster),
        seed: null,
        bucket: null,
      };
    }

    const bucket = Math.floor(Date.now() / ROTATION_BUCKET_MS);
    const filtersHash = stableHash(
      JSON.stringify({
        categoryId: query.categoryId ?? null,
        search: query.search ?? null,
        sortBy,
        lat: query.lat ?? null,
        lng: query.lng ?? null,
      }),
    );
    const cacheKey = `cluster:deals:${uniqueCode}:${bucket}:${filtersHash}:${page}`;

    const cached = await this.clusterCache.get<any>(cacheKey);
    if (cached) return cached;

    const result = await this.computeDeals(cluster, query);

    await this.clusterCache.set(cacheKey, result, CLUSTER_DEALS_TTL);
    return result;
  }

  private async computeDeals(cluster: Cluster, query: ClusterDealsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const sortBy = query.sortBy ?? ClusterDealsSortBy.FAIR;

    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.branch', 'branch')
      .leftJoinAndSelect('offer.business', 'business')
      .where('branch.clusterId = :clusterId', { clusterId: cluster.id })
      .andWhere('offer.status = :status', {
        status: CatalogueOfferStatus.ACTIVE,
      })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= NOW())')
      .andWhere('branch.isActive = :branchActive', { branchActive: true })
      .andWhere('branch.joinDiscoveryNetwork = :joinDiscoveryNetwork', {
        joinDiscoveryNetwork: true,
      })
      .andWhere('branch.allowPromotions = :allowPromotions', {
        allowPromotions: true,
      });

    const { search, categoryId } = query;
    if (search) {
      qb.andWhere(
        '(offer.name ILIKE :search OR offer.description ILIKE :search OR business.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (categoryId) {
      qb.andWhere('business.categoryId = :categoryId', { categoryId });
    }

    let reference: {
      lat: number;
      lng: number;
      source: 'customer' | 'cluster_center';
    } = this.referenceFromCluster(cluster);
    const isDistanceSort =
      sortBy === ClusterDealsSortBy.DISTANCE_ASC ||
      sortBy === ClusterDealsSortBy.DISTANCE_DESC;

    if (isDistanceSort) {
      const hasCustomerLoc =
        query.lat !== undefined &&
        query.lng !== undefined &&
        query.lat !== null &&
        query.lng !== null;
      if (hasCustomerLoc) {
        reference = {
          lat: Number(query.lat),
          lng: Number(query.lng),
          source: 'customer',
        };
      }
      qb.addSelect(
        `ST_Distance(branch.location, ST_SetSRID(ST_MakePoint(:refLng, :refLat), 4326)::geography)`,
        'distanceMeters',
      );
      qb.setParameters({ refLng: reference.lng, refLat: reference.lat });
    }

    qb.orderBy('offer.createdAt', 'DESC');
    qb.take(MAX_OFFERS_FETCH);
    let offers = await qb.getMany();

    const total = offers.length;
    if (offers.length === 0) {
      return {
        active: true,
        data: [],
        total: 0,
        page,
        limit,
        sortBy,
        reference,
        seed: null,
        bucket: null,
      };
    }

    // Ordering
    let seed: number | null = null;
    let bucket: number | null = null;
    if (sortBy === ClusterDealsSortBy.FAIR) {
      const b = Math.floor(Date.now() / ROTATION_BUCKET_MS);
      seed = stableHash(`${cluster.id}:${b}`);
      bucket = b;
      offers = this.applyFairRotation(offers, cluster.id, b);
    } else if (sortBy === ClusterDealsSortBy.NEWEST) {
      offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === ClusterDealsSortBy.PRICE_ASC) {
      offers.sort(
        (a, b) => Number(a.calculatedPrice) - Number(b.calculatedPrice),
      );
    } else if (sortBy === ClusterDealsSortBy.PRICE_DESC) {
      offers.sort(
        (a, b) => Number(b.calculatedPrice) - Number(a.calculatedPrice),
      );
    } else if (isDistanceSort) {
      const getDist = (o: any) => Number(o.distanceMeters ?? Infinity);
      const dir = sortBy === ClusterDealsSortBy.DISTANCE_ASC ? 1 : -1;
      offers.sort((a, b) => (getDist(a) - getDist(b)) * dir);
    }

    const start = (page - 1) * limit;
    const pageOffers = offers.slice(start, start + limit);

    const data = await Promise.all(
      pageOffers.map((offer) => this.mapDeal(offer)),
    );

    return {
      active: true,
      data,
      total,
      page,
      limit,
      sortBy,
      seed,
      bucket,
      reference,
    };
  }

  /**
   * Deterministic time-based rotation: every 15-minute bucket, a different
   * branch leads the ordering so every member branch's deals rotate through
   * the top. Ordering is stable within a bucket (cache-friendly).
   */
  private applyFairRotation(
    offers: CatalogueOffer[],
    clusterId: string,
    bucket: number,
  ): CatalogueOffer[] {
    const branchesInOrder = [...new Set(offers.map((o) => o.branchId))].sort();
    const memberCount = branchesInOrder.length;
    const rotationOffset = stableHash(`${clusterId}:${bucket}`) % memberCount;

    const branchRank = new Map<string, number>();
    branchesInOrder.forEach((branchId, index) => {
      branchRank.set(
        branchId,
        (index + memberCount - rotationOffset) % memberCount,
      );
    });

    return [...offers].sort((a, b) => {
      const rankDiff =
        branchRank.get(a.branchId)! - branchRank.get(b.branchId)!;
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private referenceFromCluster(cluster: Cluster) {
    return {
      lat: Number(cluster.latitude),
      lng: Number(cluster.longitude),
      source: 'cluster_center' as const,
    };
  }

  private async mapDeal(offer: CatalogueOffer) {
    const originalPrice = (offer.items || []).reduce(
      (acc, it: any) => acc + Number(it.price || 0),
      0,
    );

    let discountPercent = 0;
    if (originalPrice > 0 && Number(offer.calculatedPrice) < originalPrice) {
      discountPercent = Math.round(
        ((originalPrice - Number(offer.calculatedPrice)) / originalPrice) * 100,
      );
    }

    const claimedCount = await this.claimRepository.count({
      where: {
        offerId: offer.id,
        status: In([
          CatalogueOfferClaimStatus.CLAIMED,
          CatalogueOfferClaimStatus.REDEEMED,
        ]),
      },
    });

    const now = new Date();
    const isExpired = offer.endDate ? now > new Date(offer.endDate) : false;
    const isTrending = offer.views > 50 || offer.visits > 10;
    const maxClaims = offer.quantity ?? 100;

    const branch = (offer as any).branch;
    const business = (offer as any).business;

    return {
      id: offer.id,
      name: offer.name,
      description: offer.description,
      longDescription: offer.longDescription || offer.description,
      terms: offer.terms || [],
      pricingType: offer.pricingType,
      discountValue: offer.discountValue,
      fixedPrice: offer.fixedPrice,
      calculatedPrice: Number(offer.calculatedPrice),
      originalPrice,
      dealPrice: Number(offer.calculatedPrice),
      discountPercent,
      mainImage: offer.mainImage,
      galleryImages: offer.galleryImages || [],
      startDate: offer.startDate,
      endDate: offer.endDate,
      isExpired,
      isTrending,
      claimedCount,
      maxClaims,
      remainingLimit:
        maxClaims != null ? Math.max(0, maxClaims - claimedCount) : null,
      status: offer.status,
      views: offer.views,
      offerType: offer.offerType,
      audience: offer.audience,
      audienceTarget: offer.audienceTarget,
      maxClaimsPerCustomer: offer.maxClaimsPerCustomer,
      claimCodePrefix: offer.claimCodePrefix,
      branchId: offer.branchId,
      businessId: offer.businessId,
      distanceMeters:
        (offer as any).distanceMeters != null
          ? Number((offer as any).distanceMeters)
          : null,
      branch: branch
        ? {
            id: branch.id,
            name: branch.name,
            slug: branch.username || branch.uniqueCode,
            logoUrl: branch.logoUrl,
            address: branch.address,
            city: branch.city,
            state: branch.state,
          }
        : null,
      business: business
        ? {
            id: business.id,
            name: business.name,
            logoUrl: business.logoUrl,
          }
        : null,
    };
  }

  // ------------------------------------------------------------------
  // Cache invalidation (used by offer mutations)
  // ------------------------------------------------------------------
  async getClusterForBranch(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['id', 'clusterId'],
    });
    if (!branch || !branch.clusterId) return null;
    const cluster = await this.clusterRepository.findOne({
      where: { id: branch.clusterId },
      select: ['id', 'name', 'uniqueCode'],
    });
    if (!cluster) return null;
    return {
      id: cluster.id,
      name: cluster.name,
      uniqueCode: cluster.uniqueCode,
    };
  }

  async invalidateForBranch(branchId: string): Promise<void> {
    try {
      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
        select: ['id', 'clusterId'],
      });
      if (!branch || !branch.clusterId) return;
      const cluster = await this.clusterRepository.findOne({
        where: { id: branch.clusterId },
        select: ['uniqueCode'],
      });
      if (cluster) {
        await this.clusterCache.invalidateCluster(cluster.uniqueCode);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate cluster cache for branch ${branchId}: ${err.message}`,
      );
    }
  }

  // ------------------------------------------------------------------
  // Admin: cluster CRUD
  // ------------------------------------------------------------------
  async list(query: AdminClusterQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const search = query.search;

    const qb = this.clusterRepository.createQueryBuilder('cluster');

    if (search) {
      qb.where('cluster.name ILIKE :search', { search: `%${search}%` });
    }

    const [clusters, total] = await qb
      .orderBy('cluster.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = await Promise.all(
      clusters.map(async (cluster) => {
        const branchCount = await this.branchRepository.count({
          where: { clusterId: cluster.id },
        });
        const activeOfferCount = await this.offerRepository
          .createQueryBuilder('offer')
          .innerJoin('offer.branch', 'branch')
          .where('branch.clusterId = :clusterId', {
            clusterId: cluster.id,
          })
          .andWhere('offer.status = :status', {
            status: CatalogueOfferStatus.ACTIVE,
          })
          .getCount();
        return {
          id: cluster.id,
          name: cluster.name,
          uniqueCode: cluster.uniqueCode,
          description: cluster.description,
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          radiusMeters: cluster.radiusMeters,
          isActive: cluster.isActive,
          qrIsActive: cluster.qrIsActive,
          branchCount,
          activeOfferCount,
          scanCount: cluster.scanCount,
          createdAt: cluster.createdAt,
        };
      }),
    );

    return { data, meta: { total, page, limit } };
  }

  async getDetail(id: string) {
    const cluster = await this.clusterRepository.findOne({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const branches = await this.branchRepository.find({
      where: { clusterId: cluster.id },
      select: [
        'id',
        'name',
        'uniqueCode',
        'username',
        'logoUrl',
        'address',
        'city',
        'state',
        'isActive',
        'latitude',
        'longitude',
      ],
    });

    return {
      id: cluster.id,
      name: cluster.name,
      uniqueCode: cluster.uniqueCode,
      description: cluster.description,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      radiusMeters: cluster.radiusMeters,
      isActive: cluster.isActive,
      qrIsActive: cluster.qrIsActive,
      scanCount: cluster.scanCount,
      createdAt: cluster.createdAt,
      updatedAt: cluster.updatedAt,
      qrUrl: this.buildQrUrl(cluster.uniqueCode),
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        uniqueCode: b.uniqueCode,
        username: b.username,
        logoUrl: b.logoUrl,
        address: b.address,
        city: b.city,
        state: b.state,
        isActive: b.isActive,
      })),
    };
  }

  async create(dto: CreateClusterDto, adminId: string) {
    if (dto.latitude == null || dto.longitude == null) {
      throw new BadRequestException('latitude and longitude are required');
    }
    const cluster = this.clusterRepository.create({
      name: dto.name,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusMeters: dto.radiusMeters ?? 500,
      isActive: dto.isActive ?? true,
      qrIsActive: dto.qrIsActive ?? true,
      createdBy: adminId,
    });
    const saved = await this.clusterRepository.save(cluster);
    return this.getDetail(saved.id);
  }

  async update(id: string, dto: UpdateClusterDto) {
    const cluster = await this.clusterRepository.findOne({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster not found');

    Object.assign(cluster, dto);
    const saved = await this.clusterRepository.save(cluster);
    await this.clusterCache.invalidateCluster(saved.uniqueCode);
    return this.getDetail(saved.id);
  }

  async remove(id: string) {
    const cluster = await this.clusterRepository.findOne({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster not found');

    // Release member branches first (FK is ON DELETE SET NULL, but keep
    // membership consistent before soft-deleting the cluster).
    await this.branchRepository.update(
      { clusterId: cluster.id },
      { clusterId: null },
    );

    await this.clusterCache.invalidateCluster(cluster.uniqueCode);
    await this.clusterRepository.softDelete(cluster.id);
    return { success: true };
  }

  // ------------------------------------------------------------------
  // Admin: membership
  // ------------------------------------------------------------------
  async addBranch(clusterId: string, branchId: string) {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
    });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['id', 'clusterId'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const previousClusterId = branch.clusterId;
    branch.clusterId = cluster.id;
    await this.branchRepository.save(branch);

    await this.clusterCache.invalidateCluster(cluster.uniqueCode);
    if (previousClusterId && previousClusterId !== cluster.id) {
      const previousCluster = await this.clusterRepository.findOne({
        where: { id: previousClusterId },
        select: ['uniqueCode'],
      });
      if (previousCluster) {
        await this.clusterCache.invalidateCluster(previousCluster.uniqueCode);
      }
    }

    return { success: true };
  }

  async removeBranch(clusterId: string, branchId: string) {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
      select: ['uniqueCode'],
    });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const branch = await this.branchRepository.findOne({
      where: { id: branchId, clusterId },
      select: ['id', 'clusterId'],
    });
    if (!branch) throw new NotFoundException('Branch is not in this cluster');

    branch.clusterId = null;
    await this.branchRepository.save(branch);
    await this.clusterCache.invalidateCluster(cluster.uniqueCode);

    return { success: true };
  }

  // ------------------------------------------------------------------
  // Admin: auto-assign
  // ------------------------------------------------------------------
  async autoAssign(dto: AutoAssignClustersDto) {
    const clusters = await this.clusterRepository.find({
      where: { isActive: true },
    });
    const geoClusters = clusters.filter(
      (c) => c.latitude != null && c.longitude != null,
    );

    const unassignedBranches = await this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.clusterId IS NULL')
      .andWhere('branch.latitude IS NOT NULL')
      .andWhere('branch.longitude IS NOT NULL')
      .getMany();

    const assignments: { branchId: string; clusterId: string | null }[] = [];

    for (const branch of unassignedBranches) {
      let nearest: Cluster | null = null;
      let nearestDistance: number | null = null;

      for (const cluster of geoClusters) {
        const row: any = await this.branchRepository.manager
          .createQueryBuilder()
          .select(
            `ST_Distance(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, cluster.location)`,
            'distance',
          )
          .from(Cluster, 'cluster')
          .where('cluster.id = :clusterId', { clusterId: cluster.id })
          .andWhere(
            `ST_DWithin(cluster.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
            { radius: cluster.radiusMeters },
          )
          .setParameters({
            lng: Number(branch.longitude),
            lat: Number(branch.latitude),
          })
          .getRawOne();

        if (row && row.distance != null) {
          const distance = Number(row.distance);
          if (nearestDistance == null || distance < nearestDistance) {
            nearestDistance = distance;
            nearest = cluster;
          }
        }
      }

      assignments.push({
        branchId: branch.id,
        clusterId: nearest?.id ?? null,
      });
    }

    if (dto.dryRun) {
      return {
        dryRun: true,
        totalCandidates: unassignedBranches.length,
        assigned: assignments.filter((a) => a.clusterId).length,
        assignments,
      };
    }

    for (const assignment of assignments) {
      if (!assignment.clusterId) continue;
      await this.branchRepository.update(
        { id: assignment.branchId },
        { clusterId: assignment.clusterId },
      );
    }

    const affectedClusterIds = [
      ...new Set(assignments.map((a) => a.clusterId).filter(Boolean)),
    ];
    if (affectedClusterIds.length > 0) {
      const affected = await this.clusterRepository.find({
        where: { id: In(affectedClusterIds as string[]) },
        select: ['uniqueCode'],
      });
      await Promise.all(
        affected.map((c) => this.clusterCache.invalidateCluster(c.uniqueCode)),
      );
    }

    return {
      dryRun: false,
      totalCandidates: unassignedBranches.length,
      assigned: assignments.filter((a) => a.clusterId).length,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  private async incrementScan(uniqueCode: string): Promise<void> {
    try {
      await this.clusterRepository.increment(
        { uniqueCode },
        'scanCount',
        1,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to increment scanCount for cluster ${uniqueCode}: ${err.message}`,
      );
    }
  }

  private buildQrUrl(uniqueCode: string): string {
    const appUrl = this.configService.get<string>(
      'VEMTAP_APP_URL',
      'https://vemtap.com',
    );
    return `${appUrl}/c/${uniqueCode}`;
  }
}
