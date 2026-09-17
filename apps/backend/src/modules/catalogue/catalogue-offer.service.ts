import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import {
  CatalogueOffer,
  CatalogueOfferPricingType,
  CatalogueOfferStatus,
} from './entities/catalogue-offer.entity';
import { CatalogueItem } from './entities/catalogue-item.entity';
import {
  CreateCatalogueOfferDto,
  UpdateCatalogueOfferDto,
  CatalogueOfferQueryDto,
  PublicCatalogueOffersQueryDto,
  GenerateOfferTermsDto,
  AdminDealsQueryDto,
  AdminDealsSortBy,
  AdminDealsStatusFilter,
  AdminBusinessesQueryDto,
} from './dto/offer.dto';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import { Otp } from '../auth/entities/otp.entity';
import { MailService } from '../mail/mail.service';
import { RequestClaimOtpDto, VerifyClaimDto } from './dto/claim.dto';
import { SendDealGiftDto } from './dto/send-deal-gift.dto';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { AiCreditService } from '../ai-copilot/services/ai-credit.service';
import { OpenAIClient } from '../ai-copilot/openai/openai.client';
import { ClustersService } from '../clusters/clusters.service';

@Injectable()
export class CatalogueOfferService {
  private readonly logger = new Logger(CatalogueOfferService.name);

  constructor(
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(AiCreditService)
    private readonly aiCreditService: AiCreditService,
    @Inject(OpenAIClient) private readonly openAiClient: OpenAIClient,
    private readonly clustersService: ClustersService,
  ) {}

  async createOffer(dto: CreateCatalogueOfferDto, businessId: string) {
    const caps = await this.subscriptionsService.getCapabilities(businessId);
    if (!caps.capabilities.catalogueOffers.enabled) {
      throw new ForbiddenException(
        'Catalogue feature is not enabled for your plan',
      );
    }

    if (
      caps.capabilities.catalogueOffers.limit !== 'unlimited' &&
      typeof caps.capabilities.catalogueOffers.remaining === 'number' &&
      caps.capabilities.catalogueOffers.remaining <= 0
    ) {
      throw new ForbiddenException(
        'You have reached the limit for catalogue offers',
      );
    }

    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId, businessId },
    });
    if (!branch)
      throw new BadRequestException('Branch not found or unauthorized');

    const itemIds =
      dto.itemIds && dto.itemIds.length > 0
        ? dto.itemIds
        : dto.sourceProductId
          ? [dto.sourceProductId]
          : [];

    if (itemIds.length === 0) {
      throw new BadRequestException(
        'Please select at least one catalogue item for this offer',
      );
    }

    const items = await this.itemRepository.find({
      where: { id: In(itemIds), businessId },
      relations: ['branches'],
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('Some items not found');
    }

    // Verify items belong to the branch
    for (const item of items) {
      if (!item.branches.some((b) => b.id === dto.branchId)) {
        throw new BadRequestException(
          `Item ${item.name} is not available in branch ${dto.branchId}`,
        );
      }
    }

    const offer = this.offerRepository.create({
      ...dto,
      sourceProductId:
        dto.sourceProductId || (items.length === 1 ? items[0].id : null),
      businessId,
      items,
    });

    // Check active subscription plan to determine default isFeatured status
    const activeSub = await this.subscriptionsService.activeSubscription(
      businessId,
    );
    const autoFeatureDeals = Boolean(activeSub?.plan?.autoFeatureDeals);
    offer.isFeatured =
      dto.isFeatured !== undefined ? dto.isFeatured : autoFeatureDeals;

    offer.calculatedPrice = this.calculatePrice(offer, items);

    const saved = await this.offerRepository.save(offer);
    await this.clearCache(dto.branchId);
    return saved;
  }

  async updateOffer(
    id: string,
    dto: UpdateCatalogueOfferDto,
    businessId: string,
  ) {
    const offer = await this.offerRepository.findOne({
      where: { id, businessId },
      relations: ['items', 'items.branches', 'sourceProduct'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (dto.itemIds) {
      const items = await this.itemRepository.find({
        where: { id: In(dto.itemIds), businessId },
        relations: ['branches'],
      });
      if (items.length !== dto.itemIds.length) {
        throw new BadRequestException('Some items not found');
      }
      // Verify items belong to the branch
      for (const item of items) {
        if (!item.branches.some((b) => b.id === offer.branchId)) {
          throw new BadRequestException(
            `Item ${item.name} is not available in this branch`,
          );
        }
      }
      offer.items = items;
    }

    if (dto.sourceProductId !== undefined) {
      offer.sourceProductId = dto.sourceProductId || null;
    }

    if (dto.mainImage) offer.mainImage = dto.mainImage;
    if (dto.galleryImages) offer.galleryImages = dto.galleryImages;

    Object.assign(offer, dto);
    offer.calculatedPrice = this.calculatePrice(offer, offer.items);

    const saved = await this.offerRepository.save(offer);
    await this.clearCache(offer.branchId, id);
    return saved;
  }

  async deleteOffer(id: string, businessId: string) {
    const offer = await this.offerRepository.findOne({
      where: { id, businessId },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    const removed = await this.offerRepository.remove(offer);
    await this.clearCache(offer.branchId, id);
    return removed;
  }

  async generateTerms(
    dto: GenerateOfferTermsDto,
    businessId: string,
  ): Promise<{ terms: string[] }> {
    // 1. Consume AI credit (throws ForbiddenException if balance is insufficient)
    await this.aiCreditService.consume(businessId);

    const title = dto.title || dto.name || 'Special Offer';
    const description = dto.description || '';

    // 2. AI generation via OpenAI if available
    if (this.openAiClient.isAvailable()) {
      try {
        const systemPrompt = `You are an expert promotional offer strategist. Generate 3 to 5 clear, realistic terms and conditions for a business promotion. Output JSON with a "terms" string array.`;
        const userPrompt = `Offer Title: ${title}\nDescription: ${description}`;

        const responseText = await this.openAiClient.analyze(
          systemPrompt,
          userPrompt,
        );
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed?.terms) && parsed.terms.length > 0) {
          return { terms: parsed.terms };
        }
      } catch (err) {
        this.logger.warn(
          `OpenAI terms generation failed: ${err.message}. Using fallback.`,
        );
      }
    }

    // 3. Fallback standard terms generator
    const terms: string[] = [
      `Offer valid for "${title}" during specified promotion period.`,
      'Cannot be combined with other discounts, coupons, or special offers.',
      'Redeemable at participating branch locations while stock lasts.',
      'Merchant reserves the right to modify or terminate this offer at any time.',
    ];

    if (
      description.toLowerCase().includes('delivery') ||
      description.toLowerCase().includes('free delivery')
    ) {
      terms.push(
        'Delivery terms apply as per branch delivery radius and minimum spend requirements.',
      );
    }

    return { terms };
  }

  async findAllOffersAdmin(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;
    const offers = await this.offerRepository.find({
      where,
      relations: ['items', 'branch', 'reward', 'sourceProduct'],
      order: { createdAt: 'DESC' },
    });
    // Map offers to include computed fields
    return offers.map((offer) => ({
      ...offer,
      maxClaims: offer.quantity,
      claimedCount: 0, // Could be computed but skip for perf
    }));
  }

  async findAllOffersPublic(branchId: string, query: CatalogueOfferQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'newest' } = query;
    const cacheKey = `offers:public:branch:${branchId}:page:${page}:limit:${limit}:search:${search || ''}:sortBy:${sortBy}`;

    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(
        `Failed to get branch offers from cache: ${err.message}`,
      );
    }

    const skip = (page - 1) * limit;

    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.items', 'item')
      .where('offer.branchId = :branchId', { branchId })
      .andWhere('offer.status = :status', {
        status: CatalogueOfferStatus.ACTIVE,
      })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= NOW())');

    if (search) {
      qb.andWhere('offer.name ILIKE :search', { search: `%${search}%` });
    }

    let sortField = 'createdAt';
    let sortOrder: 'ASC' | 'DESC' = 'DESC';

    switch (sortBy) {
      case 'price_asc':
        sortField = 'calculatedPrice';
        sortOrder = 'ASC';
        break;
      case 'price_desc':
        sortField = 'calculatedPrice';
        sortOrder = 'DESC';
        break;
      case 'newest':
      default:
        sortField = 'createdAt';
        sortOrder = 'DESC';
        break;
    }

    const cursorStr = (query as any).cursor || (query as any).nextCursor;

    const paginated = await paginateWithCursor({
      queryBuilder: qb,
      cursor: cursorStr,
      page,
      limit,
      sortField,
      sortOrder,
      entityAlias: 'offer',
    });

    const result = {
      data: paginated.data,
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      cursor: paginated.cursor,
      nextCursor: paginated.nextCursor,
      prevCursor: paginated.prevCursor,
      hasNextPage: paginated.hasNextPage,
    };

    try {
      await this.cacheManager.set(cacheKey, result, 3600000); // 1 hour TTL
    } catch (err) {
      this.logger.warn(`Failed to set branch offers in cache: ${err.message}`);
    }

    return result;
  }

  async findAllOffersPublicGlobal(query: PublicCatalogueOffersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'newest',
      categoryId,
      lat,
      lng,
      radius,
      audience,
    } = query;

    const skip = (page - 1) * limit;

    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.items', 'item')
      .leftJoinAndSelect('offer.branch', 'branch')
      .leftJoinAndSelect('branch.business', 'business')
      .leftJoinAndSelect('business.category', 'category')
      .where('offer.status = :status', { status: CatalogueOfferStatus.ACTIVE })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= NOW())')
      .andWhere('branch.joinDiscoveryNetwork = :joinDiscoveryNetwork', {
        joinDiscoveryNetwork: true,
      })
      .andWhere('branch.isActive = :branchActive', { branchActive: true });

    if (search) {
      qb.andWhere(
        '(offer.name ILIKE :search OR offer.description ILIKE :search OR business.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('business.categoryId = :categoryId', { categoryId });
    }

    if (audience) {
      qb.andWhere('offer.audience = :audience', { audience });
    }

    if (lat !== undefined && lng !== undefined) {
      const earthRadius = 6371; // km
      const distanceFormula = `${earthRadius} * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(:lat)) * cos(radians(branch.latitude)) *
          cos(radians(branch.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(branch.latitude))
        ))
      )`;

      qb.addSelect(distanceFormula, 'distance');
      qb.setParameter('lat', lat);
      qb.setParameter('lng', lng);

      if (radius !== undefined && radius > 0) {
        qb.andWhere(`${distanceFormula} <= :radius`, { radius });
      }
    }

    let sortField = 'createdAt';
    let sortOrder: 'ASC' | 'DESC' = 'DESC';

    if (sortBy === 'price_asc') {
      sortField = 'calculatedPrice';
      sortOrder = 'ASC';
    } else if (sortBy === 'price_desc') {
      sortField = 'calculatedPrice';
      sortOrder = 'DESC';
    } else if (sortBy === 'trending') {
      sortField = 'views';
      sortOrder = 'DESC';
    } else {
      sortField = 'createdAt';
      sortOrder = 'DESC';
    }

    // `popular` / `featured` order by a computed claim count, which cannot be
    // expressed through cursor pagination — use offset pagination instead.
    if (sortBy === 'popular' || sortBy === 'featured') {
      const claimStatuses = [
        CatalogueOfferClaimStatus.CLAIMED,
        CatalogueOfferClaimStatus.REDEEMED,
      ];
      const claimCountSql = `(SELECT COUNT(*) FROM "catalogue_offer_claims" "claim" WHERE "claim"."offerId" = "offer"."id" AND "claim"."status" IN (:...claimStatuses))`;
      qb.setParameter('claimStatuses', claimStatuses);

      if (sortBy === 'popular') {
        qb.orderBy(claimCountSql, 'DESC');
      } else {
        // Featured: rank by a weighted score of engagement (views + claims).
        qb.orderBy(`(offer.views + ${claimCountSql} * 10)`, 'DESC');
      }

      qb.skip(skip).take(limit);
      const [rawOffers, total] = await qb.getManyAndCount();
      const mappedOffers = await this.mapPublicOffers(rawOffers);
      return { data: mappedOffers, total, page, limit };
    }

    const cursorStr = (query as any).cursor || (query as any).nextCursor;

    const paginated = await paginateWithCursor({
      queryBuilder: qb,
      cursor: cursorStr,
      page,
      limit,
      sortField,
      sortOrder,
      entityAlias: 'offer',
    });

    const rawOffers = paginated.data;
    const total = paginated.total;

    const mappedOffers = await this.mapPublicOffers(rawOffers);

    return {
      data: mappedOffers,
      total,
      page,
      limit,
      cursor: paginated.cursor,
      nextCursor: paginated.nextCursor,
      prevCursor: paginated.prevCursor,
      hasNextPage: paginated.hasNextPage,
    };
  }

  private async mapPublicOffers(rawOffers: CatalogueOffer[]) {
    if (!rawOffers || rawOffers.length === 0) return [];

    const offerIds = rawOffers.map((o) => o.id);
    let claimCountMap = new Map<string, number>();

    if (typeof this.claimRepository.createQueryBuilder === 'function') {
      const claimCountsRaw = await this.claimRepository
        .createQueryBuilder('claim')
        .select('claim.offerId', 'offerId')
        .addSelect('COUNT(claim.id)', 'count')
        .where('claim.offerId IN (:...offerIds)', { offerIds })
        .andWhere('claim.status IN (:...claimStatuses)', {
          claimStatuses: [
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ],
        })
        .groupBy('claim.offerId')
        .getRawMany();

      claimCountMap = new Map<string, number>(
        claimCountsRaw.map((row) => [row.offerId, parseInt(row.count, 10) || 0]),
      );
    } else {
      await Promise.all(
        rawOffers.map(async (offer) => {
          const count = await this.claimRepository.count({
            where: {
              offerId: offer.id,
              status: In([
                CatalogueOfferClaimStatus.CLAIMED,
                CatalogueOfferClaimStatus.REDEEMED,
              ]),
            },
          });
          claimCountMap.set(offer.id, count);
        }),
      );
    }

    return rawOffers.map((offer) => {
      const originalPrice = (offer.items || []).reduce(
        (acc, it) => acc + Number(it.price || 0),
        0,
      );

      let discountPercent = 0;
      if (originalPrice > 0 && offer.calculatedPrice < originalPrice) {
        discountPercent = Math.round(
          ((originalPrice - offer.calculatedPrice) / originalPrice) * 100,
        );
      }

      const claimedCount = claimCountMap.get(offer.id) || 0;

      return {
        id: offer.id,
        name: offer.name,
        description: offer.description,
        pricingType: offer.pricingType,
        fixedPrice: offer.fixedPrice,
        percentageOff: (offer as any).percentageOff ?? offer.discountValue,
        calculatedPrice: offer.calculatedPrice,
        originalPrice,
        discountPercent,
        status: offer.status,
        branchId: offer.branchId,
        branchName: offer.branch?.name,
        categoryName: offer.branch?.business?.category?.name,
        business: offer.branch?.business
          ? {
              id: offer.branch.business.id,
              name: offer.branch.business.name,
              slug: offer.branch.business.uniqueCode,
              logo: offer.branch.business.logoUrl ?? undefined,
              categoryId: offer.branch.business.categoryId ?? undefined,
              categoryName: offer.branch?.business?.category?.name ?? undefined,
              address: offer.branch.business.address ?? undefined,
              city: offer.branch.business.city ?? undefined,
              latitude:
                offer.branch.business.latitude ??
                offer.branch?.latitude ??
                undefined,
              longitude:
                offer.branch.business.longitude ??
                offer.branch?.longitude ??
                undefined,
            }
          : undefined,
        items: offer.items,
        claimedCount,
        totalLimit: (offer as any).totalLimit ?? offer.quantity,
        remainingLimit:
          ((offer as any).totalLimit ?? offer.quantity) != null
            ? Math.max(
                0,
                ((offer as any).totalLimit ?? offer.quantity) - claimedCount,
              )
            : null,
        startDate: offer.startDate,
        endDate: offer.endDate,
        isExpired: offer.endDate
          ? new Date() > new Date(offer.endDate)
          : false,
        maxClaimsPerCustomer: offer.maxClaimsPerCustomer,
        audienceTarget: offer.audienceTarget,
        terms: offer.terms,
        claimCodePrefix: offer.claimCodePrefix,
      };
    });
  }

  async findOneOffer(id: string, branchId?: string) {
    const cacheKey = `offers:public:details:${id}`;

    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(
        `Failed to get offer details from cache: ${err.message}`,
      );
    }

    const where: any = { id };
    if (branchId) where.branchId = branchId;
    const offer = await this.offerRepository.findOne({
      where,
      relations: [
        'items',
        'reward',
        'branch',
        'branch.business',
        'sourceProduct',
      ],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const originalPrice = offer.items.reduce(
      (acc, it) => acc + Number(it.price || 0),
      0,
    );

    let discountPercent = 0;
    if (originalPrice > 0 && offer.calculatedPrice < originalPrice) {
      discountPercent = Math.round(
        ((originalPrice - offer.calculatedPrice) / originalPrice) * 100,
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

    const isTrending = offer.views > 50 || offer.visits > 10;

    const now = new Date();
    const isExpired = offer.endDate ? now > new Date(offer.endDate) : false;

    const branchAddress =
      offer.branch?.address || offer.branch?.business?.address || undefined;
    const branchCity =
      offer.branch?.city || offer.branch?.business?.city || undefined;
    const branchState =
      offer.branch?.state || offer.branch?.business?.state || undefined;
    const branchLat =
      offer.branch?.latitude ?? offer.branch?.business?.latitude ?? undefined;
    const branchLng =
      offer.branch?.longitude ?? offer.branch?.business?.longitude ?? undefined;

    const mappedOffer = {
      ...offer,
      originalPrice,
      dealPrice: offer.calculatedPrice,
      discountPercent,
      claimedCount,
      maxClaims: offer.quantity || 100,
      isTrending,
      isExpired,
      maxClaimsPerCustomer: offer.maxClaimsPerCustomer,
      audienceTarget: offer.audienceTarget,
      terms: offer.terms || [
        'Valid during business hours',
        'Cannot be combined with other offers',
        'Valid for 7 days after claiming',
      ],
      longDescription: offer.description,
      claimCodePrefix: offer.claimCodePrefix,
      business: offer.branch?.business
        ? {
            id: offer.branch.business.id,
            name: offer.branch.business.name,
            slug:
              offer.branch.uniqueCode ||
              offer.branch.username ||
              offer.branch.business.uniqueCode,
            logo: offer.branch.business.logoUrl ?? undefined,
            categoryId: offer.branch.business.categoryId ?? undefined,
            categoryName:
              (offer.branch.business as any)?.category?.name ?? undefined,
            address: branchAddress,
            city: branchCity,
            state: branchState,
            latitude: branchLat,
            longitude: branchLng,
            phone: (offer.branch as any)?.phone ?? undefined,
            isVerified: offer.branch.business.isVerified ?? false,
          }
        : undefined,
      sourceProductId: offer.sourceProductId || null,
      sourceProduct: offer.sourceProduct
        ? {
            id: offer.sourceProduct.id,
            name: offer.sourceProduct.name,
            itemType: offer.sourceProduct.itemType,
            price: offer.sourceProduct.price,
          }
        : null,
    };

    try {
      await this.cacheManager.set(cacheKey, mappedOffer, 3600000); // 1 hour TTL
    } catch (err) {
      this.logger.warn(`Failed to set offer details in cache: ${err.message}`);
    }

    return mappedOffer;
  }

  async countOffers(branchId: string) {
    return this.offerRepository.count({
      where: {
        branchId,
        status: CatalogueOfferStatus.ACTIVE,
      },
    });
  }

  private calculatePrice(
    offer: CatalogueOffer,
    items: CatalogueItem[] = [],
  ): number {
    const sum = items.reduce((acc, item) => acc + Number(item.price || 0), 0);
    switch (offer.pricingType) {
      case CatalogueOfferPricingType.SUM:
        return Math.max(0, sum);
      case CatalogueOfferPricingType.PERCENTAGE_DISCOUNT: {
        const discountValue = Number(offer.discountValue || 0);
        if (discountValue > 100) {
          // Defensive fallback: flat Naira amount sent instead of percentage
          return Math.max(0, sum - discountValue);
        }
        return Math.max(0, sum * (1 - discountValue / 100));
      }
      case CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT: {
        const discountValue = Number(offer.discountValue || 0);
        return Math.max(0, sum - discountValue);
      }
      case CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE: {
        if (offer.fixedPrice !== null && offer.fixedPrice !== undefined) {
          return Math.max(0, Number(offer.fixedPrice));
        }
        if (
          offer.discountValue !== null &&
          offer.discountValue !== undefined &&
          Number(offer.discountValue) > 0
        ) {
          return Math.max(0, sum - Number(offer.discountValue));
        }
        return Math.max(0, sum);
      }
      default:
        return Math.max(0, sum);
    }
  }

  async requestClaimOtp(dto: RequestClaimOtpDto) {
    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId, status: CatalogueOfferStatus.ACTIVE },
    });
    if (!offer) {
      throw new NotFoundException('Promotion not found or inactive');
    }

    const now = new Date();
    if (offer.startDate && now < new Date(offer.startDate)) {
      throw new BadRequestException('Promotion has not started yet');
    }
    if (offer.endDate && now > new Date(offer.endDate)) {
      throw new BadRequestException('Promotion has expired');
    }

    if (offer.quantity !== null && offer.quantity !== undefined) {
      const claimedCount = await this.claimRepository.count({
        where: {
          offerId: offer.id,
          status: In([
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ]),
        },
      });
      if (claimedCount >= offer.quantity) {
        throw new BadRequestException(
          'This promotion has reached its claim limit',
        );
      }
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      email: dto.email.toLowerCase(),
      code,
      expiresAt,
      metadata: {
        type: 'promotion_claim',
        ...dto,
      },
    });
    await this.otpRepository.save(otp);

    await this.mailService.sendOtp(dto.email, code);

    return { message: 'Verification OTP sent successfully' };
  }

  async verifyClaim(dto: VerifyClaimDto) {
    const email = dto.email.toLowerCase();

    const otpRecord = await this.otpRepository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found');
    }
    if (otpRecord.code !== dto.code) {
      throw new BadRequestException('Invalid OTP');
    }
    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP expired');
    }
    if (otpRecord.isVerified) {
      throw new BadRequestException('OTP already verified');
    }
    if (!otpRecord.metadata || otpRecord.metadata.offerId !== dto.offerId) {
      throw new BadRequestException('Invalid OTP metadata');
    }

    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId, status: CatalogueOfferStatus.ACTIVE },
      relations: ['branch', 'branch.business'],
    });
    if (!offer) {
      throw new NotFoundException('Promotion not found or inactive');
    }

    // Check offer expiration by endDate
    if (offer.endDate && new Date() > new Date(offer.endDate)) {
      throw new BadRequestException(
        'This deal has ended. Look out for new deals from this business.',
      );
    }

    // Check audienceTarget: new vs returning customers
    if (offer.audienceTarget && offer.audienceTarget !== 'all') {
      const existingCustomerClaim = await this.claimRepository.findOne({
        where: {
          offer: { businessId: offer.businessId },
          email,
          status: In([
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ]),
        },
        relations: ['offer'],
      });

      if (offer.audienceTarget === 'new_customers' && existingCustomerClaim) {
        throw new BadRequestException(
          'This deal is for new customers only. You have previously claimed a deal from this business.',
        );
      }

      if (
        offer.audienceTarget === 'returning_customers' &&
        !existingCustomerClaim
      ) {
        throw new BadRequestException(
          'This deal is for returning customers only. Visit this business first to qualify.',
        );
      }
    }

    // Idempotency: If already claimed, return the existing claim details
    const existingClaim = await this.claimRepository.findOne({
      where: {
        offerId: offer.id,
        email,
        status: CatalogueOfferClaimStatus.CLAIMED,
      },
    });

    if (existingClaim) {
      return {
        message: 'Deal already claimed',
        claim: {
          id: existingClaim.id,
          claimCode: existingClaim.claimCode,
          expiresAt: existingClaim.expiresAt,
          status: existingClaim.status,
        },
      };
    }

    // Check maxClaimsPerCustomer
    if (
      offer.maxClaimsPerCustomer !== null &&
      offer.maxClaimsPerCustomer !== undefined
    ) {
      const customerClaimsCount = await this.claimRepository.count({
        where: {
          offerId: offer.id,
          email,
          status: In([
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ]),
        },
      });
      if (customerClaimsCount >= offer.maxClaimsPerCustomer) {
        throw new BadRequestException(
          `You have reached the maximum number of claims (${offer.maxClaimsPerCustomer}) for this deal.`,
        );
      }
    }

    const executeSave = async (managerOrRepo: any) => {
      // Re-check claim limit inside transaction to prevent race conditions
      if (offer.quantity !== null && offer.quantity !== undefined) {
        let claimedCount = 0;
        if (typeof managerOrRepo.count === 'function') {
          claimedCount = managerOrRepo.count.length === 2
            ? await managerOrRepo.count(CatalogueOfferClaim, {
                where: {
                  offerId: offer.id,
                  status: In([
                    CatalogueOfferClaimStatus.CLAIMED,
                    CatalogueOfferClaimStatus.REDEEMED,
                  ]),
                },
              })
            : await managerOrRepo.count({
                where: {
                  offerId: offer.id,
                  status: In([
                    CatalogueOfferClaimStatus.CLAIMED,
                    CatalogueOfferClaimStatus.REDEEMED,
                  ]),
                },
              });
        }
        if (claimedCount >= offer.quantity) {
          throw new BadRequestException(
            'This promotion has reached its claim limit',
          );
        }
      }

      otpRecord.isVerified = true;
      if (managerOrRepo.save && managerOrRepo.save.length === 2) {
        await managerOrRepo.save(Otp, otpRecord);
      } else {
        await this.otpRepository.save(otpRecord);
      }

      const branchCode = offer.branch?.uniqueCode || 'XXXXX';
      const prefix = offer.claimCodePrefix || 'VEM';
      const randomString = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const claimCode = `${prefix}-${branchCode}-${randomString}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const claimData = {
        offerId: offer.id,
        firstName: otpRecord.metadata.firstName,
        lastName: otpRecord.metadata.lastName || null,
        email: otpRecord.metadata.email,
        phone: otpRecord.metadata.phone,
        claimCode,
        status: CatalogueOfferClaimStatus.CLAIMED,
        expiresAt,
      };

      const claim = managerOrRepo.create
        ? managerOrRepo.create.length === 2
          ? managerOrRepo.create(CatalogueOfferClaim, claimData)
          : managerOrRepo.create(claimData)
        : this.claimRepository.create(claimData);

      const savedClaim = managerOrRepo.save && managerOrRepo.save.length === 2
        ? await managerOrRepo.save(CatalogueOfferClaim, claim)
        : await this.claimRepository.save(claim);

      await this.clearCache(offer.branchId, offer.id);

      return {
        message: 'Deal claimed successfully',
        claim: {
          id: savedClaim?.id || claim.id,
          claimCode: savedClaim?.claimCode || claim.claimCode,
          expiresAt: savedClaim?.expiresAt || claim.expiresAt,
          status: savedClaim?.status || claim.status,
        },
      };
    };

    if (this.claimRepository.manager?.transaction) {
      return await this.claimRepository.manager.transaction(executeSave);
    }
    return await executeSave(this.claimRepository);
  }

  async sendDealGift(dto: SendDealGiftDto, callerOrigin?: string) {
    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId, status: CatalogueOfferStatus.ACTIVE },
      relations: ['items', 'branch', 'branch.business', 'business'],
    });

    if (!offer) {
      throw new NotFoundException('Promotion not found or inactive');
    }

    const now = new Date();
    if (offer.startDate && now < new Date(offer.startDate)) {
      throw new BadRequestException('This promotion has not started yet');
    }
    if (offer.endDate && now > new Date(offer.endDate)) {
      throw new BadRequestException('This promotion has expired');
    }

    if (offer.quantity !== null && offer.quantity !== undefined) {
      const claimedCount = await this.claimRepository.count({
        where: {
          offerId: offer.id,
          status: In([
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ]),
        },
      });
      if (claimedCount >= offer.quantity) {
        throw new BadRequestException(
          'This promotion has reached its maximum total claim limit',
        );
      }
    }

    const recipientEmail = dto.recipientEmail.trim().toLowerCase();

    // Check max claims per customer for the recipient
    if (
      offer.maxClaimsPerCustomer !== null &&
      offer.maxClaimsPerCustomer !== undefined
    ) {
      const recipientClaimsCount = await this.claimRepository.count({
        where: {
          offerId: offer.id,
          email: recipientEmail,
          status: In([
            CatalogueOfferClaimStatus.CLAIMED,
            CatalogueOfferClaimStatus.REDEEMED,
          ]),
        },
      });
      if (recipientClaimsCount >= offer.maxClaimsPerCustomer) {
        throw new BadRequestException(
          `The recipient (${recipientEmail}) has already reached the maximum claim limit (${offer.maxClaimsPerCustomer}) for this deal.`,
        );
      }
    }

    const business = offer.branch?.business || offer.business;
    let targetBranch = offer.branch;
    if (dto.branchId && dto.branchId !== offer.branchId) {
      const branchMatch = await this.branchRepository.findOne({
        where: { id: dto.branchId },
      });
      if (branchMatch) {
        targetBranch = branchMatch;
      }
    }

    const originalPrice = (offer.items || []).reduce(
      (acc, it) => acc + Number(it.price || 0),
      0,
    );

    let discountLabel = '';
    if (
      offer.discountValue &&
      offer.pricingType === CatalogueOfferPricingType.PERCENTAGE_DISCOUNT
    ) {
      discountLabel = `${offer.discountValue}% OFF`;
    } else if (
      originalPrice > 0 &&
      Number(offer.calculatedPrice) < originalPrice
    ) {
      const saved = originalPrice - Number(offer.calculatedPrice);
      const pct = Math.round((saved / originalPrice) * 100);
      discountLabel = `Save ₦${saved.toLocaleString('en-NG')} (${pct}% OFF)`;
    }

    const emailSent = await this.mailService.sendDealGiftEmail({
      recipientEmail,
      senderName: dto.senderName?.trim(),
      senderEmail: dto.senderEmail?.trim(),
      note: dto.note?.trim(),
      frontendBaseUrl: dto.frontendBaseUrl || callerOrigin,
      offer: {
        id: offer.id,
        name: offer.name,
        description: offer.description || offer.longDescription || undefined,
        mainImage:
          offer.mainImage ||
          (offer.galleryImages && offer.galleryImages[0]) ||
          undefined,
        calculatedPrice: Number(offer.calculatedPrice),
        originalPrice: originalPrice > 0 ? originalPrice : undefined,
        discountLabel,
        endDate: offer.endDate || undefined,
        terms: offer.terms || undefined,
      },
      business: {
        name: business?.name || 'VemTap Partner',
        slug: targetBranch?.uniqueCode || business?.uniqueCode || undefined,
        phone: business?.phone || undefined,
        address: business?.address || undefined,
        logoUrl: business?.logoUrl || undefined,
      },
      branch: {
        name: targetBranch?.name || undefined,
        address: targetBranch?.address || undefined,
        city: targetBranch?.city || undefined,
        state: targetBranch?.state || undefined,
        phone: targetBranch?.phone || undefined,
      },
    });

    if (!emailSent) {
      throw new BadRequestException(
        'Failed to dispatch deal gift email. Please try again.',
      );
    }

    return {
      success: true,
      message: `Deal invitation and instructions sent successfully to ${recipientEmail}`,
    };
  }

  async redeemClaim(code: string, businessId: string) {
    // Support partial match: if code is short (4-6 chars), search by suffix
    let claim: CatalogueOfferClaim | null;
    if (code.length >= 4 && code.length <= 6) {
      claim = await this.claimRepository
        .createQueryBuilder('claim')
        .leftJoinAndSelect('claim.offer', 'offer')
        .where('claim.claimCode LIKE :suffix', { suffix: `%-${code}` })
        .getOne();
    } else {
      claim = await this.claimRepository.findOne({
        where: { claimCode: code },
        relations: ['offer'],
      });
    }

    if (!claim) {
      throw new NotFoundException(
        'The claim code you entered is not recognised. Please check and try again.',
      );
    }

    if (claim.offer.businessId !== businessId) {
      throw new ForbiddenException(
        'This claim code belongs to a different business and cannot be redeemed here.',
      );
    }

    if (claim.status === CatalogueOfferClaimStatus.REDEEMED) {
      throw new BadRequestException(
        'This claim code has already been used. Each code can only be redeemed once.',
      );
    }

    if (
      claim.status === CatalogueOfferClaimStatus.EXPIRED ||
      new Date() > claim.expiresAt
    ) {
      if (claim.status !== CatalogueOfferClaimStatus.EXPIRED) {
        claim.status = CatalogueOfferClaimStatus.EXPIRED;
        await this.claimRepository.save(claim);
      }
      throw new BadRequestException(
        'This claim code has expired. The customer may need to claim the deal again.',
      );
    }

    // Check if the offer itself has expired
    if (claim.offer.endDate && new Date() > new Date(claim.offer.endDate)) {
      throw new BadRequestException(
        'The deal associated with this code has ended. Please ask the customer to check for active deals.',
      );
    }

    claim.status = CatalogueOfferClaimStatus.REDEEMED;
    await this.claimRepository.save(claim);

    await this.offerRepository.increment({ id: claim.offerId }, 'visits', 1);
    await this.clearCache(claim.offer.branchId, claim.offerId);

    return {
      success: true,
      message: 'Claim redeemed successfully',
      claim: {
        id: claim.id,
        firstName: claim.firstName,
        lastName: claim.lastName,
        email: claim.email,
        phone: claim.phone,
        status: claim.status,
        offerName: claim.offer.name,
      },
    };
  }

  async getBusinessClaims(businessId: string) {
    return this.claimRepository.find({
      where: { offer: { businessId } },
      relations: ['offer', 'offer.items'],
      order: { createdAt: 'DESC' },
    });
  }

  private async clearCache(branchId: string, offerId?: string) {
    try {
      const cacheMgr = this.cacheManager as any;
      const store =
        cacheMgr.store || (cacheMgr.stores ? cacheMgr.stores[0] : null);

      if (store && typeof store.keys === 'function') {
        const branchKeys = await store.keys(
          `*offers:public:branch:${branchId}:*`,
        );
        for (const key of branchKeys) {
          if (typeof store.del === 'function') {
            await store.del(key);
          } else {
            await this.cacheManager.del(key);
          }
        }

        if (offerId) {
          const detailKeys = await store.keys(
            `*offers:public:details:${offerId}*`,
          );
          for (const key of detailKeys) {
            if (typeof store.del === 'function') {
              await store.del(key);
            } else {
              await this.cacheManager.del(key);
            }
          }
        }
      } else {
        if (typeof (this.cacheManager as any).reset === 'function') {
          await (this.cacheManager as any).reset();
        }
      }

      await this.clustersService.invalidateForBranch(branchId);
    } catch (error) {
      this.logger.error(`Failed to clear offers cache: ${error.message}`);
    }
  }

  // --- Admin Deals Management ---

  async getAdminDeals(query: AdminDealsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.business', 'business')
      .leftJoinAndSelect('offer.branch', 'branch')
      .leftJoinAndSelect('offer.items', 'items')
      .leftJoinAndSelect('offer.sourceProduct', 'sourceProduct');

    // Search by deal name or business name
    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        '(LOWER(offer.name) LIKE LOWER(:term) OR LOWER(business.name) LIKE LOWER(:term))',
        { term },
      );
    }

    // Filter by businessId
    if (query.businessId) {
      qb.andWhere('offer.businessId = :businessId', {
        businessId: query.businessId,
      });
    }

    // Filter by status (active, inactive, expired)
    const now = new Date();
    if (query.status === AdminDealsStatusFilter.ACTIVE) {
      qb.andWhere(
        'offer.status = :activeStatus AND (offer.endDate IS NULL OR offer.endDate >= :now)',
        {
          activeStatus: CatalogueOfferStatus.ACTIVE,
          now,
        },
      );
    } else if (query.status === AdminDealsStatusFilter.INACTIVE) {
      qb.andWhere('offer.status = :inactiveStatus', {
        inactiveStatus: CatalogueOfferStatus.INACTIVE,
      });
    } else if (query.status === AdminDealsStatusFilter.EXPIRED) {
      qb.andWhere('offer.endDate IS NOT NULL AND offer.endDate < :now', {
        now,
      });
    }

    // Filter by isFeatured
    if (query.isFeatured !== undefined) {
      qb.andWhere('offer.isFeatured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    // Filter by price range
    if (query.minPrice !== undefined) {
      qb.andWhere('offer.calculatedPrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('offer.calculatedPrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // Filter by date range (startDate / endDate)
    if (query.startDate) {
      qb.andWhere(
        '(offer.startDate >= :filterStartDate OR (offer.startDate IS NULL AND offer.createdAt >= :filterStartDate))',
        {
          filterStartDate: new Date(query.startDate),
        },
      );
    }
    if (query.endDate) {
      qb.andWhere(
        '(offer.endDate <= :filterEndDate OR (offer.endDate IS NULL AND offer.createdAt <= :filterEndDate))',
        {
          filterEndDate: new Date(query.endDate),
        },
      );
    }

    // Filter by plan name or tier
    if (query.plan && query.plan.trim()) {
      const planTerm = `%${query.plan.trim()}%`;
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM subscriptions sub
          JOIN plans p ON p.id = sub."planId"
          WHERE sub."businessId" = offer."businessId"
            AND sub.status IN ('active', 'trial')
            AND (LOWER(p.name) LIKE LOWER(:planTerm) OR LOWER(p.id::text) = LOWER(:exactPlanTerm))
        )`,
        { planTerm, exactPlanTerm: query.plan.trim() },
      );
    }

    // Sorting
    switch (query.sortBy) {
      case AdminDealsSortBy.MOST_POPULAR:
        qb.orderBy('offer.views', 'DESC').addOrderBy('offer.createdAt', 'DESC');
        break;
      case AdminDealsSortBy.FEATURED_FIRST:
        qb.orderBy('offer.isFeatured', 'DESC').addOrderBy(
          'offer.createdAt',
          'DESC',
        );
        break;
      case AdminDealsSortBy.PRICE_LOW_HIGH:
        qb.orderBy('offer.calculatedPrice', 'ASC');
        break;
      case AdminDealsSortBy.PRICE_HIGH_LOW:
        qb.orderBy('offer.calculatedPrice', 'DESC');
        break;
      case AdminDealsSortBy.ENDING_SOON:
        qb.orderBy('offer.endDate', 'ASC', 'NULLS LAST');
        break;
      case AdminDealsSortBy.NEWEST:
      default:
        qb.orderBy('offer.createdAt', 'DESC');
        break;
    }

    qb.skip(skip).take(limit);

    const [offers, total] = await qb.getManyAndCount();

    const offerIds = offers.map((o) => o.id);
    const businessIds = Array.from(
      new Set(offers.map((o) => o.businessId).filter(Boolean)),
    );

    // Fetch claims count per offer
    let claimsCountMap: Record<string, number> = {};
    if (offerIds.length > 0) {
      const claimsCounts = await this.claimRepository
        .createQueryBuilder('claim')
        .select('claim.offerId', 'offerId')
        .addSelect('COUNT(claim.id)', 'count')
        .where('claim.offerId IN (:...offerIds)', { offerIds })
        .groupBy('claim.offerId')
        .getRawMany();

      claimsCountMap = claimsCounts.reduce((acc, row) => {
        acc[row.offerId] = parseInt(row.count, 10) || 0;
        return acc;
      }, {});
    }

    // Fetch active subscription plan per business
    const businessPlanMap: Record<
      string,
      { id: string; name: string; isFree: boolean } | null
    > = {};
    for (const bId of businessIds) {
      try {
        const sub = await this.subscriptionsService.activeSubscription(bId);
        if (sub && sub.plan) {
          businessPlanMap[bId] = {
            id: sub.plan.id,
            name: sub.plan.name,
            isFree: sub.plan.isFree,
          };
        } else {
          businessPlanMap[bId] = null;
        }
      } catch {
        businessPlanMap[bId] = null;
      }
    }

    const data = offers.map((offer) => {
      let computedStatus: 'active' | 'inactive' | 'expired' = 'active';
      if (offer.status === CatalogueOfferStatus.INACTIVE) {
        computedStatus = 'inactive';
      } else if (offer.endDate && new Date(offer.endDate) < now) {
        computedStatus = 'expired';
      }

      const originalPrice = (offer.items || []).reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0,
      );

      const dealPrice = Number(offer.calculatedPrice);
      let discount = 0;
      if (offer.pricingType === CatalogueOfferPricingType.PERCENTAGE_DISCOUNT) {
        discount = Number(offer.discountValue) || 0;
      } else if (
        offer.pricingType === CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE
      ) {
        discount = Math.max(0, originalPrice - dealPrice);
      } else if (
        offer.pricingType === CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT
      ) {
        discount =
          Number(offer.discountValue) || Math.max(0, originalPrice - dealPrice);
      }

      return {
        id: offer.id,
        name: offer.name,
        description: offer.description,
        image: offer.mainImage,
        mainImage: offer.mainImage,
        galleryImages: offer.galleryImages || [],
        status: computedStatus,
        sourceProductId: offer.sourceProductId || null,
        sourceProduct: offer.sourceProduct
          ? {
              id: offer.sourceProduct.id,
              name: offer.sourceProduct.name,
              itemType: offer.sourceProduct.itemType,
              price: offer.sourceProduct.price,
            }
          : null,
        pricing: {
          pricingType: offer.pricingType,
          originalPrice: originalPrice > 0 ? originalPrice : dealPrice,
          dealPrice,
          discount,
          discountValue: offer.discountValue ? Number(offer.discountValue) : null,
          fixedPrice: offer.fixedPrice ? Number(offer.fixedPrice) : null,
        },
        dates: {
          startDate: offer.startDate,
          endDate: offer.endDate,
          createdAt: offer.createdAt,
        },
        claimsCount: claimsCountMap[offer.id] || 0,
        viewsCount: offer.views || 0,
        isFeatured: offer.isFeatured || false,
        business: {
          id: offer.business?.id || offer.businessId,
          name: offer.business?.name || 'Unknown Business',
        },
        branch: {
          id: offer.branch?.id || offer.branchId,
          name: offer.branch?.name || 'Unknown Branch',
        },
        subscriptionPlan: businessPlanMap[offer.businessId] || {
          id: 'free',
          name: 'Free Plan',
          isFree: true,
        },
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAdminDealsStats() {
    const now = new Date();

    const totalDeals = await this.offerRepository.count();

    const activeDeals = await this.offerRepository
      .createQueryBuilder('offer')
      .where(
        'offer.status = :status AND (offer.endDate IS NULL OR offer.endDate >= :now)',
        {
          status: CatalogueOfferStatus.ACTIVE,
          now,
        },
      )
      .getCount();

    const featuredDeals = await this.offerRepository.count({
      where: { isFeatured: true },
    });

    const expiredDeals = await this.offerRepository
      .createQueryBuilder('offer')
      .where('offer.endDate IS NOT NULL AND offer.endDate < :now', { now })
      .getCount();

    return {
      totalDeals,
      activeDeals,
      featuredDeals,
      expiredDeals,
    };
  }

  async toggleDealFeatured(id: string) {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    offer.isFeatured = !offer.isFeatured;
    const saved = await this.offerRepository.save(offer);

    if (offer.branchId) {
      await this.clearCache(offer.branchId, id);
    }

    return {
      id: saved.id,
      isFeatured: saved.isFeatured,
      message: `Deal ${saved.isFeatured ? 'marked as featured' : 'unfeatured'} successfully`,
    };
  }

  async getAdminBusinessesList(query: AdminBusinessesQueryDto) {
    const qb = this.businessRepository
      .createQueryBuilder('business')
      .select(['business.id', 'business.name'])
      .orderBy('business.name', 'ASC');

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.where('LOWER(business.name) LIKE LOWER(:term)', { term });
    }

    const businesses = await qb.getMany();
    return businesses.map((b) => ({
      id: b.id,
      name: b.name,
    }));
  }
}
