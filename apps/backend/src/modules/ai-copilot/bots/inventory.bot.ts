import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class InventoryBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let totalProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    try {
      const stats = await this.dataSource
        .query(
          `SELECT 
           COUNT(*)::int as total,
           COUNT(CASE WHEN stock <= "lowStockThreshold" AND stock > 0 THEN 1 END)::int as low_stock,
           COUNT(CASE WHEN stock <= 0 THEN 1 END)::int as out_of_stock,
           COALESCE(SUM(stock * price), 0)::float as stock_value
         FROM products WHERE "branchId" = $1`,
          [branchId],
        )
        .catch(() => []);

      if (stats && stats.length > 0) {
        totalProducts = stats[0].total || 0;
        lowStockCount = stats[0].low_stock || 0;
        outOfStockCount = stats[0].out_of_stock || 0;
        totalStockValue = Math.round(stats[0].stock_value || 0);
      }
    } catch (e) {
      totalProducts = 0;
      lowStockCount = 0;
      outOfStockCount = 0;
      totalStockValue = 0;
    }

    return {
      page: 'inventory',
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStockValue,
      currency: 'NGN',
    };
  }
}
