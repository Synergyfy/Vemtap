import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BundleDiscount } from '../entities/bundle-discount.entity';
import { CreateBundleDiscountDto, UpdateBundleDiscountDto } from '../dto/bundle-discount.dto';

@Injectable()
export class BundleDiscountsService {
  constructor(
    @InjectRepository(BundleDiscount)
    private readonly bundleDiscountRepository: Repository<BundleDiscount>,
  ) {}

  async findAll(): Promise<BundleDiscount[]> {
    return this.bundleDiscountRepository.find({
      order: { minQuantity: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BundleDiscount> {
    const discount = await this.bundleDiscountRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException(`Bundle discount with ID ${id} not found`);
    }
    return discount;
  }

  async create(createDto: CreateBundleDiscountDto): Promise<BundleDiscount> {
    const discount = this.bundleDiscountRepository.create(createDto);
    return this.bundleDiscountRepository.save(discount);
  }

  async update(id: string, updateDto: UpdateBundleDiscountDto): Promise<BundleDiscount> {
    const discount = await this.findOne(id);
    Object.assign(discount, updateDto);
    return this.bundleDiscountRepository.save(discount);
  }

  async remove(id: string): Promise<void> {
    const discount = await this.findOne(id);
    await this.bundleDiscountRepository.remove(discount);
  }

  async getActiveDiscounts(): Promise<BundleDiscount[]> {
    return this.bundleDiscountRepository.find({
      where: { isActive: true },
      order: { minQuantity: 'ASC' },
    });
  }
}
