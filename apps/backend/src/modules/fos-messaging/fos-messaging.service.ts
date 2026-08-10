import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Setting } from '../settings/entities/setting.entity';

export interface MessagingLogsQuery {
  page?: number;
  perPage?: number;
  businessId?: string;
}

@Injectable()
export class FosMessagingService {
  constructor(
    @InjectRepository(MessageLog)
    private readonly messageLogRepo: Repository<MessageLog>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private async getPricing() {
    const setting = await this.settingRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    return {
      costPerSms: this.toNumber(setting[0]?.messagingCostSms ?? 2.5),
      sellingPricePerSms: this.toNumber(setting[0]?.creditPriceSms ?? 4.0),
      costPerEmail: this.toNumber(setting[0]?.messagingCostEmail ?? 0.1),
      sellingPricePerEmail: this.toNumber(setting[0]?.creditPriceEmail ?? 2.0),
    };
  }

  private async groupLogs(
    channel: string,
    businessId?: string,
  ): Promise<
    {
      businessId: string;
      businessName: string;
      count: number;
      date: string;
    }[]
  > {
    const qb = this.messageLogRepo
      .createQueryBuilder('ml')
      .select('br."businessId"', 'businessId')
      .addSelect('b.name', 'businessName')
      .addSelect(
        "to_char(ml.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
        'date',
      )
      .addSelect('COALESCE(SUM(ml.units), 0)', 'count')
      .innerJoin(Branch, 'br', 'br.id = ml."branchId"')
      .innerJoin(Business, 'b', 'b.id = br."businessId"')
      .where('ml.channel = :channel', { channel })
      .groupBy('br."businessId"')
      .addGroupBy('b.name')
      .addGroupBy('date')
      .orderBy('date', 'DESC');

    if (businessId) {
      qb.andWhere('br."businessId" = :businessId', { businessId });
    }

    const rows: Array<{
      businessId: string;
      businessName: string;
      count: string;
      date: string;
    }> = await qb.getRawMany();
    return rows.map((r) => ({
      businessId: r.businessId,
      businessName: r.businessName,
      count: parseInt(r.count || '0', 10) || 0,
      date: r.date,
    }));
  }

  async getSmsLogs(query: MessagingLogsQuery) {
    const page = query.page || 1;
    const perPage = query.perPage || 50;
    const pricing = await this.getPricing();
    const grouped = await this.groupLogs('SMS', query.businessId);

    const total = grouped.length;
    const start = (page - 1) * perPage;
    const pageRows = grouped.slice(start, start + perPage);

    const logs = pageRows.map((row, i) => {
      const totalCost = Math.round(row.count * pricing.costPerSms * 100) / 100;
      const totalRevenue =
        Math.round(row.count * pricing.sellingPricePerSms * 100) / 100;
      return {
        id: `sms_${start + i}`,
        businessId: row.businessId,
        businessName: row.businessName,
        smsCount: row.count,
        costPerSms: pricing.costPerSms,
        sellingPricePerSms: pricing.sellingPricePerSms,
        totalCost,
        totalRevenue,
        totalProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
        date: row.date,
      };
    });

    return { logs, total, page, perPage };
  }

  async getEmailLogs(query: MessagingLogsQuery) {
    const page = query.page || 1;
    const perPage = query.perPage || 50;
    const pricing = await this.getPricing();
    const grouped = await this.groupLogs('EMAIL', query.businessId);

    const total = grouped.length;
    const start = (page - 1) * perPage;
    const pageRows = grouped.slice(start, start + perPage);

    const logs = pageRows.map((row, i) => {
      const totalCost =
        Math.round(row.count * pricing.costPerEmail * 100) / 100;
      const totalRevenue =
        Math.round(row.count * pricing.sellingPricePerEmail * 100) / 100;
      return {
        id: `email_${start + i}`,
        businessId: row.businessId,
        businessName: row.businessName,
        emailCount: row.count,
        costPerEmail: pricing.costPerEmail,
        sellingPricePerEmail: pricing.sellingPricePerEmail,
        totalCost,
        totalRevenue,
        totalProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
        date: row.date,
      };
    });

    return { logs, total, page, perPage };
  }

  async getAggregates() {
    const pricing = await this.getPricing();
    const [sms, email] = await Promise.all([
      this.groupLogs('SMS'),
      this.groupLogs('EMAIL'),
    ]);

    const totalSmsSent = sms.reduce((sum, r) => sum + r.count, 0);
    const totalEmailsSent = email.reduce((sum, r) => sum + r.count, 0);

    const smsCost = totalSmsSent * pricing.costPerSms;
    const emailCost = totalEmailsSent * pricing.costPerEmail;
    const smsRevenue = totalSmsSent * pricing.sellingPricePerSms;
    const emailRevenue = totalEmailsSent * pricing.sellingPricePerEmail;

    const totalMessagingCost = Math.round((smsCost + emailCost) * 100) / 100;
    const totalMessagingRevenue =
      Math.round((smsRevenue + emailRevenue) * 100) / 100;

    return {
      totalSmsSent,
      totalEmailsSent,
      totalMessagingCost,
      totalMessagingRevenue,
      totalMessagingProfit:
        Math.round((totalMessagingRevenue - totalMessagingCost) * 100) / 100,
    };
  }
}
