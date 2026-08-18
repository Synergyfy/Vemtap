import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { PromotionCode } from '../entities/promotion-code.entity';
import { Coupon } from '../entities/coupon.entity';
import { CouponRedemption } from '../entities/coupon-redemption.entity';
import { CreatePromoCodeDto } from '../dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from '../dto/update-promo-code.dto';
import { QueryPromoCodesDto } from '../dto/query-promo-codes.dto';
import { QueryRedemptionsDto } from '../dto/query-redemptions.dto';

@Injectable()
export class PromotionCodesService {
  private readonly logger = new Logger(PromotionCodesService.name);

  constructor(
    @InjectRepository(PromotionCode)
    private readonly promoCodeRepository: Repository<PromotionCode>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponRedemption)
    private readonly redemptionRepository: Repository<CouponRedemption>,
  ) {}

  /**
   * Create a new promotion code linked to a coupon
   */
  async create(
    adminUserId: string,
    couponId: string,
    dto: CreatePromoCodeDto,
  ): Promise<PromotionCode> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${couponId} not found`);
    }

    const code = (dto.code || '').trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Promo code cannot be empty');
    }

    const existing = await this.promoCodeRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new BadRequestException(
        `Promotion code '${code}' already exists. Please choose a unique code.`,
      );
    }

    const promo = this.promoCodeRepository.create({
      ...dto,
      code,
      couponId,
      createdById: adminUserId,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const saved = await this.promoCodeRepository.save(promo);
    this.logger.log(
      `Admin ${adminUserId} created promo code '${saved.code}' under coupon ${couponId}`,
    );
    return saved;
  }

  /**
   * Find promotion codes with optional filters
   */
  async findAll(query: QueryPromoCodesDto): Promise<PromotionCode[]> {
    const qb = this.promoCodeRepository
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.coupon', 'coupon')
      .leftJoinAndSelect('promo.createdBy', 'createdBy')
      .orderBy('promo.createdAt', 'DESC');

    if (query.couponId) {
      qb.andWhere('promo.couponId = :couponId', { couponId: query.couponId });
    }

    if (query.isActive !== undefined) {
      const isActive = query.isActive === 'true';
      qb.andWhere('promo.isActive = :isActive', { isActive });
    }

    if (query.search) {
      qb.andWhere('promo.code ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }

    return qb.getMany();
  }

  /**
   * Find single promo code by ID
   */
  async findOne(id: string): Promise<PromotionCode> {
    const promo = await this.promoCodeRepository.findOne({
      where: { id },
      relations: ['coupon', 'createdBy', 'redemptions'],
    });
    if (!promo) {
      throw new NotFoundException(`Promotion code with ID ${id} not found`);
    }
    return promo;
  }

  /**
   * Update promotion code
   */
  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromotionCode> {
    const promo = await this.findOne(id);

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      if (code !== promo.code) {
        const existing = await this.promoCodeRepository.findOne({
          where: { code },
        });
        if (existing) {
          throw new BadRequestException(
            `Promotion code '${code}' already exists`,
          );
        }
        promo.code = code;
      }
    }

    if (dto.isActive !== undefined) promo.isActive = dto.isActive;
    if (dto.startsAt !== undefined)
      promo.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.expiresAt !== undefined)
      promo.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.maxRedemptions !== undefined)
      promo.maxRedemptions = dto.maxRedemptions;
    if (dto.maxRedemptionsPerUser !== undefined)
      promo.maxRedemptionsPerUser = dto.maxRedemptionsPerUser;
    if (dto.firstTimeOnly !== undefined)
      promo.firstTimeOnly = dto.firstTimeOnly;
    if (dto.allowedBusinessIds !== undefined)
      promo.allowedBusinessIds = dto.allowedBusinessIds;

    return this.promoCodeRepository.save(promo);
  }

  /**
   * Toggle promotion code active/suspended state
   */
  async toggleActive(
    id: string,
    explicitStatus?: boolean,
  ): Promise<PromotionCode> {
    const promo = await this.findOne(id);
    promo.isActive =
      explicitStatus !== undefined ? explicitStatus : !promo.isActive;
    return this.promoCodeRepository.save(promo);
  }

  /**
   * Query redemptions audit log
   */
  async findRedemptions(query: QueryRedemptionsDto): Promise<CouponRedemption[]> {
    const qb = this.redemptionRepository
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.coupon', 'coupon')
      .leftJoinAndSelect('redemption.promotionCode', 'promotionCode')
      .leftJoinAndSelect('redemption.business', 'business')
      .leftJoinAndSelect('redemption.user', 'user')
      .orderBy('redemption.createdAt', 'DESC');

    if (query.couponId) {
      qb.andWhere('redemption.couponId = :couponId', {
        couponId: query.couponId,
      });
    }

    if (query.promotionCodeId) {
      qb.andWhere('redemption.promotionCodeId = :promotionCodeId', {
        promotionCodeId: query.promotionCodeId,
      });
    }

    if (query.businessId) {
      qb.andWhere('redemption.businessId = :businessId', {
        businessId: query.businessId,
      });
    }

    if (query.planId) {
      qb.andWhere('redemption.planId = :planId', { planId: query.planId });
    }

    if (query.search) {
      qb.andWhere(
        '(redemption.paymentReference ILIKE :search OR promotionCode.code ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    return qb.getMany();
  }

  /**
   * Analytics & Stats for Promotions & Discounts
   */
  async getStats(): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    totalPromoCodes: number;
    activePromoCodes: number;
    totalRedemptions: number;
    totalDiscountAmountGiven: number;
    totalRevenueFromDiscountedSales: number;
  }> {
    const totalCoupons = await this.couponRepository.count();
    const activeCoupons = await this.couponRepository.count({
      where: { isActive: true },
    });
    const totalPromoCodes = await this.promoCodeRepository.count();
    const activePromoCodes = await this.promoCodeRepository.count({
      where: { isActive: true },
    });
    const totalRedemptions = await this.redemptionRepository.count();

    const sums = await this.redemptionRepository
      .createQueryBuilder('redemption')
      .select('SUM(redemption.discountAmount)', 'totalDiscount')
      .addSelect('SUM(redemption.finalAmount)', 'totalRevenue')
      .getRawOne();

    return {
      totalCoupons,
      activeCoupons,
      totalPromoCodes,
      activePromoCodes,
      totalRedemptions,
      totalDiscountAmountGiven: Number(sums?.totalDiscount || 0),
      totalRevenueFromDiscountedSales: Number(sums?.totalRevenue || 0),
    };
  }
}
