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
} from './dto/offer.dto';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import { Otp } from '../auth/entities/otp.entity';
import { MailService } from '../mail/mail.service';
import { RequestClaimOtpDto, VerifyClaimDto } from './dto/claim.dto';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { AiCreditService } from '../ai-copilot/services/ai-credit.service';
import { OpenAIClient } from '../ai-copilot/openai/openai.client';

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

    const items = await this.itemRepository.find({
      where: { id: In(dto.itemIds), businessId },
      relations: ['branches'],
    });

    if (items.length !== dto.itemIds.length) {
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
      businessId,
      items,
    });

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
      relations: ['items', 'items.branches'],
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
      relations: ['items', 'branch', 'reward'],
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
        cos(radians(:lat)) * cos(radians(branch.latitude)) *
        cos(radians(branch.longitude) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(branch.latitude))
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

    const mappedOffers = await Promise.all(
      rawOffers.map(async (offer) => {
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
      }),
    );

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
      relations: ['items', 'reward', 'branch', 'branch.business'],
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

  private calculatePrice(offer: CatalogueOffer, items: CatalogueItem[]) {
    const sum = items.reduce((acc, item) => acc + Number(item.price), 0);
    switch (offer.pricingType) {
      case CatalogueOfferPricingType.SUM:
        return sum;
      case CatalogueOfferPricingType.PERCENTAGE_DISCOUNT:
        const discountValue = Number(offer.discountValue || 0);
        return sum * (1 - discountValue / 100);
      case CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE:
        return Number(offer.fixedPrice || sum);
      default:
        return sum;
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

    otpRecord.isVerified = true;
    await this.otpRepository.save(otpRecord);

    const branchCode = offer.branch?.uniqueCode || 'XXXXX';
    const prefix = offer.claimCodePrefix || 'VEM';
    const randomString = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const claimCode = `${prefix}-${branchCode}-${randomString}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const claim = this.claimRepository.create({
      offerId: offer.id,
      firstName: otpRecord.metadata.firstName,
      lastName: otpRecord.metadata.lastName || null,
      email: otpRecord.metadata.email,
      phone: otpRecord.metadata.phone,
      claimCode,
      status: CatalogueOfferClaimStatus.CLAIMED,
      expiresAt,
    });

    await this.claimRepository.save(claim);
    await this.clearCache(offer.branchId, offer.id);

    return {
      message: 'Deal claimed successfully',
      claim: {
        id: claim.id,
        claimCode: claim.claimCode,
        expiresAt: claim.expiresAt,
        status: claim.status,
      },
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
    } catch (error) {
      this.logger.error(`Failed to clear offers cache: ${error.message}`);
    }
  }
}
