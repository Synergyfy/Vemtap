import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from '../../businesses/entities/business.entity';

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly dataSource: DataSource,
  ) {}

  public async getBalance(businessId: string): Promise<number> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new BadRequestException('Business not found');
    }
    return Number(business.balance) || 0;
  }

  public async deduct(
    businessId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const business = await manager.findOne(Business, {
        where: { id: businessId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!business) {
        throw new BadRequestException('Business not found');
      }

      const currentBalance = Number(business.balance) || 0;
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient credits');
      }

      business.balance = currentBalance - amount;
      await manager.save(business);

      // TODO: Log transaction to wallet_transactions table when created
    });
  }
}
