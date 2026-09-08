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
  CatalogueItemType,
} from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';

interface ItemCountRow {
  businessId: string;
  productCount: string;
  serviceCount: string;
}

const STATS_CACHE_KEY = 'public:stats';
const STATS_TTL_MS = 5 * 60 * 1000;

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

  async findBusinesses(q?: string, limit = 8) {
    const qb = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.branches', 'branch')
      .where('business.status = :status', { status: BusinessStatus.ACTIVE })
      .orderBy('business.createdAt', 'DESC')
      .take(limit);

    if (q) {
      qb.andWhere('business.name ILIKE :q', { q: `%${q}%` });
    }

    const businesses = await qb.getMany();

    if (businesses.length === 0) return [];

    const businessIds = businesses.map((b) => b.id);

    const counts = await this.itemRepository
      .createQueryBuilder('item')
      .select('item."businessId"', 'businessId')
      .addSelect(
        `SUM(CASE WHEN item."itemType" = :product THEN 1 ELSE 0 END)`,
        'productCount',
      )
      .addSelect(
        `SUM(CASE WHEN item."itemType" = :service THEN 1 ELSE 0 END)`,
        'serviceCount',
      )
      .where('item."businessId" IN (:...businessIds)', { businessIds })
      .andWhere('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .setParameter('product', CatalogueItemType.PRODUCT)
      .setParameter('service', CatalogueItemType.SERVICE)
      .groupBy('item."businessId"')
      .getRawMany<ItemCountRow>();

    const countMap = new Map<
      string,
      { productCount: number; serviceCount: number }
    >();
    for (const row of counts) {
      countMap.set(row.businessId, {
        productCount: parseInt(row.productCount, 10) || 0,
        serviceCount: parseInt(row.serviceCount, 10) || 0,
      });
    }

    return businesses.map((business) =>
      this.toPublicBusiness(business, countMap.get(business.id)),
    );
  }

  async search(query: string | undefined, limit = 8) {
    if (!query?.trim()) {
      return { deals: [], businesses: [], categories: [] };
    }
    const q = query.trim();

    const dealsResult =
      await this.catalogueOfferService.findAllOffersPublicGlobal({
        search: q,
        limit,
      });

    const categories = await this.categoryRepository.find({
      where: { name: ILike(`%${q}%`) },
      take: limit,
    });

    return {
      deals: dealsResult.data ?? [],
      businesses: await this.findBusinesses(q, limit),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
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

  private toPublicBusiness(
    business: Business,
    counts?: { productCount: number; serviceCount: number },
  ) {
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
      productCount: counts?.productCount ?? 0,
      serviceCount: counts?.serviceCount ?? 0,
    };
  }
}

export interface PublicStats {
  totalBusinesses: number;
  totalActiveDeals: number;
  totalClaims: number;
  totalBranches: number;
}
