import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PromotionCodesService } from './promotion-codes.service';
import { PromotionCode } from '../entities/promotion-code.entity';
import { Coupon, DiscountType, CouponDuration } from '../entities/coupon.entity';
import { CouponRedemption } from '../entities/coupon-redemption.entity';

describe('PromotionCodesService', () => {
  let service: PromotionCodesService;
  let promoRepo: any;
  let couponRepo: any;
  let redemptionRepo: any;

  const mockCoupon: Coupon = {
    id: 'coupon-1',
    name: '20% Off Launch',
    discountType: DiscountType.PERCENTAGE,
    amount: 20,
    currency: 'NGN',
    maxDiscountAmount: 5000,
    minSubtotal: null,
    duration: CouponDuration.ONCE,
    durationInMonths: null,
    applicablePlanIds: [],
    applicableBillingPeriods: [],
    isActive: true,
    createdById: 'admin-1',
    createdBy: null,
    promotionCodes: [],
    redemptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  };

  const mockPromo: PromotionCode = {
    id: 'promo-1',
    couponId: 'coupon-1',
    coupon: mockCoupon,
    code: 'SAVE20',
    isActive: true,
    startsAt: null,
    expiresAt: null,
    maxRedemptions: 100,
    timesRedeemed: 5,
    maxRedemptionsPerUser: 1,
    firstTimeOnly: false,
    allowedBusinessIds: [],
    createdById: 'admin-1',
    createdBy: null,
    redemptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  };

  beforeEach(async () => {
    promoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ id: 'promo-1', ...dto })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      count: jest.fn().mockResolvedValue(1),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPromo]),
      })),
    };

    couponRepo = {
      findOne: jest.fn().mockResolvedValue(mockCoupon),
      count: jest.fn().mockResolvedValue(1),
    };

    redemptionRepo = {
      count: jest.fn().mockResolvedValue(5),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalDiscount: '10000',
          totalRevenue: '40000',
        }),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionCodesService,
        { provide: getRepositoryToken(PromotionCode), useValue: promoRepo },
        { provide: getRepositoryToken(Coupon), useValue: couponRepo },
        { provide: getRepositoryToken(CouponRedemption), useValue: redemptionRepo },
      ],
    }).compile();

    service = module.get<PromotionCodesService>(PromotionCodesService);
  });

  it('should create a promotion code attached to a coupon', async () => {
    const result = await service.create('admin-1', 'coupon-1', {
      code: 'save20', // Test normalization to SAVE20
      maxRedemptions: 50,
    });

    expect(result.code).toBe('SAVE20');
    expect(result.couponId).toBe('coupon-1');
    expect(promoRepo.save).toHaveBeenCalled();
  });

  it('should throw BadRequestException if promo code already exists', async () => {
    promoRepo.findOne.mockResolvedValueOnce(mockPromo);

    await expect(
      service.create('admin-1', 'coupon-1', {
        code: 'SAVE20',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should toggle promo code active status', async () => {
    promoRepo.findOne.mockResolvedValueOnce({ ...mockPromo, isActive: true });
    const toggled = await service.toggleActive('promo-1');
    expect(toggled.isActive).toBe(false);
  });

  it('should return analytics stats', async () => {
    const stats = await service.getStats();
    expect(stats.totalCoupons).toBe(1);
    expect(stats.totalPromoCodes).toBe(1);
    expect(stats.totalRedemptions).toBe(5);
    expect(stats.totalDiscountAmountGiven).toBe(10000);
    expect(stats.totalRevenueFromDiscountedSales).toBe(40000);
  });
});
