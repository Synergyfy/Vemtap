import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class CustomerAnalyticsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let totalVisitors = 0;
    let returningVisitorRate = 0;
    let avgLtv = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT 
           COUNT(*)::int as total,
           COUNT(CASE WHEN "visitCount" > 1 THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as return_rate,
           COALESCE(AVG("totalSpend"), 0)::float as avg_spend
         FROM visitors WHERE "branchId" = $1`,
        [branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        totalVisitors = stats[0].total || 0;
        returningVisitorRate = totalVisitors === 0 ? 0 : Math.round(stats[0].return_rate ?? 0);
        avgLtv = Math.round(stats[0].avg_spend || 0);
      }
    } catch (e) {
      totalVisitors = 0;
      returningVisitorRate = 0;
      avgLtv = 0;
    }

    return {
      page: 'analytics-customers',
      totalVisitors,
      returningVisitorRate,
      avgLtv,
      currency: 'NGN',
    };
  }
}
