import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Coupon, DiscountType, CouponDuration } from '../entities/coupon.entity';

describe('CouponsService', () => {
  let service: CouponsService;
  let repo: any;

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

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'coupon-1', ...dto })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      find: jest.fn().mockResolvedValue([mockCoupon]),
      findOne: jest.fn().mockResolvedValue({ ...mockCoupon }),
      remove: jest.fn().mockResolvedValue(mockCoupon),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: getRepositoryToken(Coupon), useValue: repo },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should create a coupon', async () => {
    const result = await service.create('admin-1', {
      name: 'Black Friday 50%',
      discountType: DiscountType.PERCENTAGE,
      amount: 50,
    });

    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result.name).toBe('Black Friday 50%');
    expect(result.createdById).toBe('admin-1');
  });

  it('should list all coupons', async () => {
    const list = await service.findAll();
    expect(list).toHaveLength(1);
    expect(repo.find).toHaveBeenCalled();
  });

  it('should toggle coupon active status', async () => {
    const toggled = await service.toggleActive('coupon-1');
    expect(toggled.isActive).toBe(false);

    const explicitlyActivated = await service.toggleActive('coupon-1', true);
    expect(explicitlyActivated.isActive).toBe(true);
  });

  it('should throw NotFoundException if coupon does not exist', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
  });
});
