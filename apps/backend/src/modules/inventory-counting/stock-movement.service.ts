import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
  ) {}

  async record(input: {
    itemId: string;
    businessId: string;
    branchId?: string | null;
    userId?: string | null;
    type: StockMovementType;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    referenceId?: string | null;
  }) {
    return this.movementRepository.save(
      this.movementRepository.create({
        ...input,
        branchId: input.branchId ?? null,
        userId: input.userId ?? null,
        quantityChange: input.newQuantity - input.previousQuantity,
        referenceId: input.referenceId ?? null,
      }),
    );
  }

  async list(
    businessId: string,
    options: {
      branchId?: string;
      itemId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const where: FindOptionsWhere<StockMovement> = { businessId };
    if (options.branchId) where.branchId = options.branchId;
    if (options.itemId) where.itemId = options.itemId;
    const [data, total] = await this.movementRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
