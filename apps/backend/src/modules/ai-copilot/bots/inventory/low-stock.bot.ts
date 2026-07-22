import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class LowStockBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let lowStockItemsCount = 0;
    let outOfStockItemsCount = 0;
    let estimatedRestockCost = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT 
           COUNT(CASE WHEN stock <= "lowStockThreshold" AND stock > 0 THEN 1 END)::int as low_stock,
           COUNT(CASE WHEN stock <= 0 THEN 1 END)::int as out_of_stock,
           COALESCE(SUM(CASE WHEN stock <= "lowStockThreshold" THEN "lowStockThreshold" * price END), 0)::float as restock_cost
         FROM products WHERE "branchId" = $1`,
        [branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        lowStockItemsCount = stats[0].low_stock || 0;
        outOfStockItemsCount = stats[0].out_of_stock || 0;
        estimatedRestockCost = Math.round(stats[0].restock_cost || 0);
      }
    } catch (e) {
      lowStockItemsCount = 0;
      outOfStockItemsCount = 0;
      estimatedRestockCost = 0;
    }

    return {
      page: 'inventory-low-stock',
      lowStockItemsCount,
      outOfStockItemsCount,
      estimatedRestockCost,
      currency: 'NGN',
    };
  }
}
