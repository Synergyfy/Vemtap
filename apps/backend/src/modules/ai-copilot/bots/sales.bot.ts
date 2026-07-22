import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class SalesBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let todaySales = 0;
    let todayOrders = 0;
    let avgOrderValue = 0;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const stats = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(total), 0)::float as today_total,
           COUNT(*)::int as today_orders
         FROM pos_sales WHERE "branchId" = $1 AND "orderedAt" >= $2 AND status = 'COMPLETED'`,
        [branchId, todayStart],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        todaySales = Math.round(stats[0].today_total || 0);
        todayOrders = stats[0].today_orders || 0;
        avgOrderValue = todayOrders > 0 ? Math.round(todaySales / todayOrders) : 0;
      }
    } catch (e) {
      todaySales = 0;
      todayOrders = 0;
      avgOrderValue = 0;
    }

    return {
      page: 'sales',
      todaySales,
      todayOrders,
      avgOrderValue,
      currency: 'NGN',
    };
  }
}
