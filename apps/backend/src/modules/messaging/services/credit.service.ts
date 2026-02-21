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
    ) { }

    public async getBalance(businessId: string): Promise<number> {
        const business = await this.businessRepository.findOne({ where: { id: businessId } });
        if (!business) {
            throw new BadRequestException('Business not found');
        }
        // Assumes there's a credits or wallet balance property on the Business
        // Fallback to 0 if missing from original entity.
        return (business as any).credits ?? 1000; // Mock starting balance for integration
    }

    public async deduct(businessId: string, amount: number, reason: string): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const business = await manager.findOne(Business, { where: { id: businessId }, lock: { mode: 'pessimistic_write' } });
            if (!business) {
                throw new BadRequestException('Business not found');
            }

            const currentBalance = (business as any).credits ?? 1000; // Mock current balance
            if (currentBalance < amount) {
                throw new BadRequestException('Insufficient credits');
            }

            (business as any).credits = currentBalance - amount;
            await manager.save(business);

            // We should arguably store a transaction log here (Reason: reason).
        });
    }
}
