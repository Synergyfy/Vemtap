import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Category } from '../businesses/entities/category.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from '../catalogue/entities/catalogue-offer-claim.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';
import {
  PublicBusinessesQueryDto,
  PublicBusinessSortBy,
} from './dto/public-discovery.dto';

const STATS_CACHE_KEY = 'public:stats';
const STATS_TTL_MS = 5 * 60 * 1000;
const EARTH_RADIUS_KM = 6371;

interface PublicLocation {
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface PublicSearchProduct {
  id: string;
  name: string;
  price: number;
  shortDescription: string | null;
  description: string | null;
  mainImage: string | null;
  galleryImages: string[] | null;
  itemType: string;
  discountType: string;
  discountValue: number | null;
  priceType: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  duration: string | null;
  isBookable: boolean;
  tags: string[] | null;
  sku: string | null;
  stockQuantity: number | null;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  businessId: string;
  businessName: string;
  businessLogo: string | null;
  branchId: string | null;
  branchName: string | null;
  branchAddress: string | null;
}

@Injectable()
export class PublicDiscoveryService {
  private readonly logger = new Logger(PublicDiscoveryService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    private readonly catalogueOfferService: CatalogueOfferService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findBusinesses(query: PublicBusinessesQueryDto = {}) {
    const {
      search,
      categoryId,
      sortBy = PublicBusinessSortBy.NEWEST,
      lat,
      lng,
      radius,
      limit = 8,
    } = query;

    const qb = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.branches', 'branch')
      .where('business.status = :status', { status: BusinessStatus.ACTIVE });

    if (search) {
      qb.andWhere(
        '(business.name ILIKE :search OR business.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('business.categoryId = :categoryId', { categoryId });
    }

    if (
      lat !== undefined &&
      lng !== undefined &&
      radius !== undefined &&
      radius > 0
    ) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM branches b2
          WHERE b2."businessId" = business.id
            AND b2."isActive" = true
            AND ${this.distanceExpression('b2')} <= :radius
        )`,
        { lat, lng, radius },
      );
    }

    if (sortBy === PublicBusinessSortBy.NAME_ASC) {
      qb.orderBy('business.name', 'ASC');
    } else {
      qb.orderBy('business.createdAt', 'DESC');
    }

    qb.take(limit);

    const businesses = await qb.getMany();
    return businesses.map((business) => this.toPublicBusiness(business));
  }

  async search(
    query: string | undefined,
    limit = 8,
    location: PublicLocation = {},
  ) {
    if (!query?.trim()) {
      return { deals: [], businesses: [], categories: [], products: [] };
    }
    const q = query.trim();

    const [dealsResult, businesses, categories, products] = await Promise.all([
      this.catalogueOfferService.findAllOffersPublicGlobal({
        search: q,
        limit,
        lat: location.lat,
        lng: location.lng,
        radius: location.radius,
      }),
      this.findBusinesses({
        search: q,
        limit,
        lat: location.lat,
        lng: location.lng,
        radius: location.radius,
      }),
      this.categoryRepository.find({
        where: { name: ILike(`%${q}%`) },
        take: limit,
      }),
      this.findProducts(q, limit, location),
    ]);

    return {
      deals: dealsResult.data ?? [],
      businesses,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
      products,
    };
  }

  async getStats() {
    try {
      const cached = await this.cacheManager.get<PublicStats>(STATS_CACHE_KEY);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(
        `Failed to read public stats from cache: ${(err as Error).message}`,
      );
    }

    const [totalBusinesses, totalActiveDeals, totalClaims, totalBranches] =
      await Promise.all([
        this.businessRepository.count({
          where: { status: BusinessStatus.ACTIVE },
        }),
        this.offerRepository
          .createQueryBuilder('offer')
          .where('offer.status = :status', {
            status: CatalogueOfferStatus.ACTIVE,
          })
          .andWhere('(offer.endDate IS NULL OR offer.endDate >= NOW())')
          .getCount(),
        this.claimRepository.count({
          where: {
            status: In([
              CatalogueOfferClaimStatus.CLAIMED,
              CatalogueOfferClaimStatus.REDEEMED,
            ]),
          },
        }),
        this.branchRepository.count(),
      ]);

    const stats: PublicStats = {
      totalBusinesses,
      totalActiveDeals,
      totalClaims,
      totalBranches,
    };

    try {
      await this.cacheManager.set(STATS_CACHE_KEY, stats, STATS_TTL_MS);
    } catch (err) {
      this.logger.warn(
        `Failed to cache public stats: ${(err as Error).message}`,
      );
    }

    return stats;
  }

  /**
   * Haversine distance in km between `:lat`/`:lng` and a branch alias,
   * falling back to the owning business coordinates when the branch has none.
   * The main query alias must be `business`.
   */
  private distanceExpression(branchAlias: string): string {
    return `${EARTH_RADIUS_KM} * acos(LEAST(1.0, GREATEST(-1.0,
      cos(radians(:lat)) * cos(radians(COALESCE(${branchAlias}.latitude, business.latitude))) *
      cos(radians(COALESCE(${branchAlias}.longitude, business.longitude)) - radians(:lng)) +
      sin(radians(:lat)) * sin(radians(COALESCE(${branchAlias}.latitude, business.latitude)))
    )))`;
  }

  /**
   * Catalogue items (products and services) across every active branch,
   * matched by name/description and optionally narrowed by proximity.
   */
  private async findProducts(
    q: string | undefined,
    limit: number,
    location: PublicLocation = {},
  ): Promise<PublicSearchProduct[]> {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.business', 'business')
      .leftJoinAndSelect('item.branches', 'branch')
      .where('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .andWhere('item.isSuspended = false');

    if (q) {
      qb.andWhere(
        `(item.name ILIKE :q OR item.shortDescription ILIKE :q OR item.description ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    if (
      location.lat !== undefined &&
      location.lng !== undefined &&
      location.radius !== undefined &&
      location.radius > 0
    ) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM catalogue_item_branches cib
          JOIN branches b2 ON b2.id = cib."branchId"
          WHERE cib."itemId" = item.id
            AND b2."isActive" = true
            AND ${this.distanceExpression('b2')} <= :radius
        )`,
        { lat: location.lat, lng: location.lng, radius: location.radius },
      );
    }

    const items = await qb
      .orderBy('item.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return items.map((item) => this.toSearchProduct(item, location));
  }

  private toSearchProduct(
    item: CatalogueItem,
    location: PublicLocation = {},
  ): PublicSearchProduct {
    const branch = this.pickProductBranch(item, location);

    return {
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      shortDescription: item.shortDescription ?? null,
      description: item.description ?? null,
      mainImage: item.mainImage ?? null,
      galleryImages: item.galleryImages ?? null,
      itemType: item.itemType,
      discountType: item.discountType,
      discountValue: item.discountValue ?? null,
      priceType: item.priceType ?? null,
      priceRangeMin: item.priceRangeMin ?? null,
      priceRangeMax: item.priceRangeMax ?? null,
      duration: item.duration ?? null,
      isBookable: item.isBookable ?? false,
      tags: item.tags ?? null,
      sku: item.sku ?? null,
      stockQuantity: item.stockQuantity ?? null,
      status: item.status,
      categoryId: item.categoryId ?? null,
      categoryName: item.category?.name ?? null,
      businessId: item.businessId,
      businessName: item.business?.name ?? '',
      businessLogo: item.business?.logoUrl ?? null,
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? null,
      branchAddress: branch?.address ?? null,
    };
  }

  /**
   * With a location, pick the branch nearest to the searcher; otherwise the
   * main branch (falling back to the first active one).
   */
  private pickProductBranch(
    item: CatalogueItem,
    location: PublicLocation = {},
  ): Branch | null {
    const branches = (item.branches ?? []).filter((b) => b.isActive !== false);
    if (branches.length === 0) return null;

    if (location.lat !== undefined && location.lng !== undefined) {
      const withCoords = branches.filter(
        (b) => b.latitude != null && b.longitude != null,
      );
      if (withCoords.length > 0) {
        return withCoords.reduce((nearest, candidate) =>
          this.haversineKm(
            location.lat as number,
            location.lng as number,
            candidate.latitude,
            candidate.longitude,
          ) <
          this.haversineKm(
            location.lat as number,
            location.lng as number,
            nearest.latitude,
            nearest.longitude,
          )
            ? candidate
            : nearest,
        );
      }
    }

    return branches.find((b) => b.isMainBranch) ?? branches[0];
  }

  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
  }

  private toPublicBusiness(business: Business) {
    const branches = business.branches || [];
    const main = branches.find((b) => b.isMainBranch) || branches[0];
    return {
      id: business.id,
      name: business.name,
      logoUrl: business.logoUrl,
      description: business.description,
      address: business.address,
      state: business.state,
      city: business.city,
      categoryId: business.categoryId,
      categoryName: business.category?.name ?? null,
      isVerified: business.isVerified,
      slug: main?.username || main?.uniqueCode || business.uniqueCode,
      branchCode: main?.uniqueCode ?? null,
    };
  }
}

export interface PublicStats {
  totalBusinesses: number;
  totalActiveDeals: number;
  totalClaims: number;
  totalBranches: number;
}
