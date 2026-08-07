import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { Cluster, ClusterType } from './entities/cluster.entity';
import { ClusterOffer } from './entities/cluster-offer.entity';
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
  AutoAssignScope,
} from './dto/cluster.dto';
import {
  CLUSTER_AUTO_ASSIGN_QUEUE,
  CLUSTER_AUTO_ASSIGN_JOB_ID,
  ClusterAutoAssignJobData,
} from './cluster-auto-assign.constants';
import {
  ClusterOffersQueryDto,
  SetClusterOfferPinnedDto,
} from './dto/cluster-offer.dto';

const ROTATION_BUCKET_MS = 15 * 60 * 1000;
const MAX_OFFERS_FETCH = 1000;

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

@Injectable()
export class ClustersService {
  private readonly logger = new Logger(ClustersService.name);

  constructor(
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(ClusterOffer)
    private readonly clusterOfferRepository: Repository<ClusterOffer>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    private readonly clusterCache: ClusterCacheService,
    private readonly configService: ConfigService,
    @InjectQueue(CLUSTER_AUTO_ASSIGN_QUEUE)
    private readonly autoAssignQueue: Queue,
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

  /**
   * Base query for offers that auto-match a cluster: active offers from member
   * branches that have opted into the discovery network. Shared by the public
   * deals feed and the admin auto-match list.
   */
  private buildOfferQuery(
    clusterId: string,
    search?: string,
    categoryId?: string,
  ) {
    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.branch', 'branch')
      .leftJoinAndSelect('offer.business', 'business')
      .leftJoinAndSelect('offer.items', 'offerItems')
      .where('branch.clusterId = :clusterId', { clusterId })
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

    if (search) {
      qb.andWhere(
        '(offer.name ILIKE :search OR offer.description ILIKE :search OR business.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (categoryId) {
      qb.andWhere('business.categoryId = :categoryId', { categoryId });
    }

    return qb;
  }

  private async computeDeals(cluster: Cluster, query: ClusterDealsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const sortBy = query.sortBy ?? ClusterDealsSortBy.FAIR;

    const qb = this.buildOfferQuery(cluster.id, query.search, query.categoryId);
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

    const pinned = await this.clusterOfferRepository.find({
      where: { clusterId: cluster.id, isPinned: true },
      select: ['offerId', 'pinnedAt'],
    });
    const pinnedIds = new Set(pinned.map((p) => p.offerId));
    const pinnedAt = new Map(
      pinned.map((p) => [p.offerId, p.pinnedAt ?? p.createdAt]),
    );

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
      const dir = sortBy === ClusterDealsSortBy.DISTANCE_ASC ? 1 : -1;
      offers.sort((a, b) => {
        const dA = this.distanceFromReference(a, reference);
        const dB = this.distanceFromReference(b, reference);
        return (dA - dB) * dir;
      });
      for (const offer of offers) {
        const d = this.distanceFromReference(offer, reference);
        (
          offer as CatalogueOffer & { distanceMeters?: number | null }
        ).distanceMeters = Number.isFinite(d) ? Math.round(d) : null;
      }
    }

    if (pinnedIds.size > 0) {
      offers = this.orderPinnedFirst(offers, pinnedIds, pinnedAt);
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

  /**
   * Pinned offers always lead the ordering (oldest pin first, then newest
   * offer) regardless of the active sort, so admin-curated deals stay on top.
   */
  private orderPinnedFirst(
    offers: CatalogueOffer[],
    pinnedIds: Set<string>,
    pinnedAt: Map<string, Date>,
  ): CatalogueOffer[] {
    const pinned = offers
      .filter((o) => pinnedIds.has(o.id))
      .sort((a, b) => {
        const aAt = pinnedAt.get(a.id)?.getTime() ?? 0;
        const bAt = pinnedAt.get(b.id)?.getTime() ?? 0;
        if (aAt !== bAt) return aAt - bAt;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    const rest = offers.filter((o) => !pinnedIds.has(o.id));
    return [...pinned, ...rest];
  }

  private referenceFromCluster(cluster: Cluster) {
    return {
      lat: Number(cluster.latitude),
      lng: Number(cluster.longitude),
      source: 'cluster_center' as const,
    };
  }

  private distanceFromReference(
    offer: CatalogueOffer,
    ref: { lat: number; lng: number },
  ): number {
    const branch = offer.branch;
    if (
      !branch ||
      branch.latitude == null ||
      branch.longitude == null ||
      ref.lat == null ||
      ref.lng == null
    ) {
      return Infinity;
    }
    return haversineMeters(
      ref.lat,
      ref.lng,
      Number(branch.latitude),
      Number(branch.longitude),
    );
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
          type: cluster.type,
          parentId: cluster.parentId,
          country: cluster.country,
          state: cluster.state,
          city: cluster.city,
          area: cluster.area,
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

    const parent = cluster.parentId
      ? await this.clusterRepository.findOne({
          where: { id: cluster.parentId },
          select: ['id', 'name', 'type'],
        })
      : null;

    return {
      id: cluster.id,
      name: cluster.name,
      type: cluster.type,
      parentId: cluster.parentId,
      parent: parent
        ? { id: parent.id, name: parent.name, type: parent.type }
        : null,
      country: cluster.country,
      state: cluster.state,
      city: cluster.city,
      area: cluster.area,
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
    if (dto.parentId) {
      const parent = await this.clusterRepository.findOne({
        where: { id: dto.parentId },
        select: ['id'],
      });
      if (!parent) throw new NotFoundException('Parent cluster not found');
    }
    const cluster = this.clusterRepository.create({
      name: dto.name,
      type: dto.type ?? ClusterType.MARKET,
      parentId: dto.parentId,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      area: dto.area,
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

    if (dto.parentId === cluster.id) {
      throw new BadRequestException('A cluster cannot be its own parent');
    }
    if (dto.parentId) {
      const parent = await this.clusterRepository.findOne({
        where: { id: dto.parentId },
        select: ['id'],
      });
      if (!parent) throw new NotFoundException('Parent cluster not found');
    }

    Object.assign(cluster, dto);
    const saved = await this.clusterRepository.save(cluster);
    await this.clusterCache.invalidateCluster(saved.uniqueCode);
    return this.getDetail(saved.id);
  }

  // ------------------------------------------------------------------
  // Admin: offers (auto-match + pin/unpin)
  // ------------------------------------------------------------------
  async getClusterOffers(clusterId: string, query: ClusterOffersQueryDto) {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
      select: ['id'],
    });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const qb = this.buildOfferQuery(clusterId, query.search, query.categoryId);
    qb.orderBy('offer.createdAt', 'DESC');
    const offers = await qb.getMany();
    const autoMatched = await Promise.all(
      offers.map((offer) => this.mapDeal(offer)),
    );

    const pinnedRows = await this.clusterOfferRepository.find({
      where: { clusterId, isPinned: true },
      order: { pinnedAt: 'ASC' },
    });

    let pinned: any[] = [];
    if (pinnedRows.length > 0) {
      const pinnedOfferIds = pinnedRows.map((row) => row.offerId);
      const pinnedOffers = await this.offerRepository.find({
        where: { id: In(pinnedOfferIds) },
        relations: ['branch', 'business', 'items'],
      });
      const pinnedById = new Map(pinnedOffers.map((o) => [o.id, o]));
      pinned = (
        await Promise.all(
          pinnedRows.map(async (row) => {
            const offer = pinnedById.get(row.offerId);
            if (!offer) return null;
            const deal = await this.mapDeal(offer);
            return { ...deal, pinnedAt: row.pinnedAt ?? row.createdAt };
          }),
        )
      ).filter(Boolean);
    }

    return {
      autoMatched,
      pinned,
      total: autoMatched.length,
    };
  }

  async setOfferPinned(
    clusterId: string,
    offerId: string,
    dto: SetClusterOfferPinnedDto,
    adminId: string,
  ) {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
      select: ['id', 'uniqueCode'],
    });
    if (!cluster) throw new NotFoundException('Cluster not found');

    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      select: ['id'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const existing = await this.clusterOfferRepository.findOne({
      where: { clusterId, offerId },
    });

    if (dto.pinned) {
      if (existing) {
        existing.isPinned = true;
        existing.pinnedBy = adminId;
        existing.pinnedAt = new Date();
        await this.clusterOfferRepository.save(existing);
      } else {
        await this.clusterOfferRepository.save(
          this.clusterOfferRepository.create({
            clusterId,
            offerId,
            isPinned: true,
            pinnedBy: adminId,
            pinnedAt: new Date(),
          }),
        );
      }
    } else if (existing) {
      await this.clusterOfferRepository.remove(existing);
    }

    await this.clusterCache.invalidateCluster(cluster.uniqueCode);

    return { pinned: dto.pinned, offerId, clusterId };
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
    const scope = dto.scope ?? AutoAssignScope.UNASSIGNED;

    if (dto.async && !dto.dryRun) {
      return this.enqueueAutoAssign(scope);
    }

    return this.runAutoAssign(scope, dto.dryRun ?? false);
  }

  // Enqueues a single background job. The fixed jobId means BullMQ dedups
  // concurrent/queued runs regardless of whether the trigger was the cron,
  // an admin, or a deployment restart.
  private async enqueueAutoAssign(scope: AutoAssignScope) {
    const job = await this.autoAssignQueue.add(
      'auto-assign',
      { scope } satisfies ClusterAutoAssignJobData,
      {
        jobId: CLUSTER_AUTO_ASSIGN_JOB_ID,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    );
    return { enqueued: true, jobId: job.id };
  }

  @Cron('*/15 * * * *')
  async backfillUnassignedBranches() {
    await this.enqueueAutoAssign(AutoAssignScope.UNASSIGNED);
  }

  @Cron('0 * * * *')
  async reassignClustersInBackground() {
    await this.enqueueAutoAssign(AutoAssignScope.ALL);
  }

  async runAutoAssign(
    scope: AutoAssignScope,
    dryRun: boolean,
  ): Promise<{
    dryRun: boolean;
    scope: AutoAssignScope;
    totalCandidates: number;
    assigned: number;
    reassigned: number;
    assignments?: {
      branchId: string;
      clusterId: string | null;
      previousClusterId?: string | null;
      distanceMeters?: number | null;
    }[];
  }> {
    // The nearest-covering-cluster lookup is a LATERAL join, which TypeORM's
    // QueryBuilder cannot express — hence this static, parameter-free raw query.
    // COALESCE on location covers clusters created before the PostGIS trigger
    // kept clusters.location in sync with latitude/longitude.
    const scopeFilter =
      scope === AutoAssignScope.ALL ? '' : 'AND b."clusterId" IS NULL';
    const sql = `
      SELECT
        b."id" AS "branchId",
        b."clusterId" AS "currentClusterId",
        c."id" AS "clusterId",
        ST_Distance(
          COALESCE(c."location", ST_SetSRID(ST_MakePoint(c."longitude"::float8, c."latitude"::float8), 4326)::geography),
          ST_SetSRID(ST_MakePoint(b."longitude"::float8, b."latitude"::float8), 4326)::geography
        ) AS "distanceMeters"
      FROM "branches" b
      LEFT JOIN LATERAL (
        SELECT c2."id", c2."location", c2."longitude", c2."latitude"
        FROM "clusters" c2
        WHERE c2."isActive" = true
          AND c2."latitude" IS NOT NULL
          AND c2."longitude" IS NOT NULL
          AND ST_DWithin(
            COALESCE(c2."location", ST_SetSRID(ST_MakePoint(c2."longitude"::float8, c2."latitude"::float8), 4326)::geography),
            ST_SetSRID(ST_MakePoint(b."longitude"::float8, b."latitude"::float8), 4326)::geography,
            c2."radiusMeters"
          )
        ORDER BY ST_Distance(
          COALESCE(c2."location", ST_SetSRID(ST_MakePoint(c2."longitude"::float8, c2."latitude"::float8), 4326)::geography),
          ST_SetSRID(ST_MakePoint(b."longitude"::float8, b."latitude"::float8), 4326)::geography
        ) ASC
        LIMIT 1
      ) c ON true
      WHERE b."latitude" IS NOT NULL
        AND b."longitude" IS NOT NULL
        ${scopeFilter}
    `;

    const rows: {
      branchId: string;
      currentClusterId: string | null;
      clusterId: string | null;
      distanceMeters: number | null;
    }[] = await this.branchRepository.manager.query(sql);

    const assignments: {
      branchId: string;
      clusterId: string | null;
      previousClusterId?: string | null;
      distanceMeters?: number | null;
    }[] = [];

    for (const row of rows) {
      const distanceMeters =
        row.distanceMeters != null ? Number(row.distanceMeters) : null;

      if (scope === AutoAssignScope.UNASSIGNED) {
        assignments.push({
          branchId: row.branchId,
          clusterId: row.clusterId,
          distanceMeters,
        });
        continue;
      }

      // Reassign scope: never unassign. Only move a branch when a different
      // covering cluster is strictly closer than its current one.
      if (!row.clusterId) continue;
      if (row.clusterId === row.currentClusterId) continue;

      assignments.push({
        branchId: row.branchId,
        clusterId: row.clusterId,
        previousClusterId: row.currentClusterId,
        distanceMeters,
      });
    }

    const committed = assignments.filter((a) => a.clusterId);
    const reassigned = assignments.filter((a) => a.previousClusterId).length;

    if (dryRun) {
      return {
        dryRun: true,
        scope,
        totalCandidates: rows.length,
        assigned: committed.length,
        reassigned,
        assignments,
      };
    }

    const UPDATE_CHUNK = 50;
    for (let i = 0; i < committed.length; i += UPDATE_CHUNK) {
      await Promise.all(
        committed
          .slice(i, i + UPDATE_CHUNK)
          .map((a) =>
            this.branchRepository.update(
              { id: a.branchId },
              { clusterId: a.clusterId },
            ),
          ),
      );
    }

    const affectedClusterIds = [
      ...new Set(
        assignments
          .map((a) => [a.clusterId, a.previousClusterId])
          .flat()
          .filter(Boolean),
      ),
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
      scope,
      totalCandidates: rows.length,
      assigned: committed.length,
      reassigned,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  private async incrementScan(uniqueCode: string): Promise<void> {
    try {
      await this.clusterRepository.increment({ uniqueCode }, 'scanCount', 1);
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
