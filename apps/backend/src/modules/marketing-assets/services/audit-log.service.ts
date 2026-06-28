import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAuditLog } from '../entities/marketing-audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(MarketingAuditLog)
    private readonly logRepo: Repository<MarketingAuditLog>,
  ) {}

  async log(params: {
    businessId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
  }): Promise<MarketingAuditLog> {
    const normalizedParams = { ...params };
    if (
      !normalizedParams.businessId ||
      normalizedParams.businessId.trim() === ''
    ) {
      normalizedParams.businessId = '00000000-0000-0000-0000-000000000000';
    }
    const entry = this.logRepo.create(normalizedParams);
    return this.logRepo.save(entry);
  }

  async findAll(
    businessId?: string,
    entityType?: string,
    action?: string,
    limit = 50,
    offset = 0,
  ): Promise<{ logs: MarketingAuditLog[]; total: number }> {
    const query = this.logRepo.createQueryBuilder('log');

    if (businessId) {
      query.andWhere('log.businessId = :businessId', { businessId });
    }
    if (entityType) {
      query.andWhere('log.entityType = :entityType', { entityType });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    const total = await query.getCount();
    const logs = await query
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return { logs, total };
  }
}
