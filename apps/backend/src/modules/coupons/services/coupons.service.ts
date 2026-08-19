import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(adminUserId: string, dto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponRepository.create({
      ...dto,
      createdById: adminUserId,
    });
    const saved = await this.couponRepository.save(coupon);
    this.logger.log(
      `Admin ${adminUserId} created coupon ${saved.id} ("${saved.name}")`,
    );
    return saved;
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      relations: ['createdBy', 'promotionCodes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['createdBy', 'promotionCodes', 'redemptions'],
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    Object.assign(coupon, dto);
    return this.couponRepository.save(coupon);
  }

  async toggleActive(id: string, explicitStatus?: boolean): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.isActive =
      explicitStatus !== undefined ? explicitStatus : !coupon.isActive;
    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }
}
