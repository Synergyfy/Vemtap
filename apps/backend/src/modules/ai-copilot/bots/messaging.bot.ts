import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class MessagingBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let totalMessagesSent = 0;
    let deliverySuccessRate = 98;
    let activeCampaigns = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT COUNT(*)::int as count FROM messaging_logs WHERE "branchId" = $1`,
        [branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        totalMessagesSent = stats[0].count || 0;
      }
    } catch (e) {
      totalMessagesSent = 0;
      deliverySuccessRate = 0;
      activeCampaigns = 0;
    }

    return {
      page: 'messaging',
      totalMessagesSent,
      deliverySuccessRate,
      activeCampaigns,
    };
  }
}
