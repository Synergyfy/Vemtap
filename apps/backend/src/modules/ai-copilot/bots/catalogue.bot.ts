import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class CatalogueBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let catalogueOrders = 0;
    let catalogueRevenue = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT 
           COUNT(*)::int as count,
           COALESCE(SUM("totalAmount"), 0)::float as revenue
         FROM catalogue_orders WHERE "branchId" = $1`,
        [branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        catalogueOrders = stats[0].count || 0;
        catalogueRevenue = Math.round(stats[0].revenue || 0);
      }
    } catch (e) {
      catalogueOrders = 0;
      catalogueRevenue = 0;
    }

    return {
      page: 'catalogue',
      catalogueOrders,
      catalogueRevenue,
      currency: 'NGN',
    };
  }
}
