import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class PosRegisterBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let registerStatus = 'OPEN';
    let shiftTotalSales = 0;
    let shiftTransactionCount = 0;
    let cashSalesTotal = 0;
    let digitalSalesTotal = 0;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const stats = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM("totalAmount"), 0)::float as total,
           COUNT(*)::int as count,
           COALESCE(SUM(CASE WHEN "paymentMethod" = 'CASH' THEN "totalAmount" END), 0)::float as cash,
           COALESCE(SUM(CASE WHEN "paymentMethod" != 'CASH' THEN "totalAmount" END), 0)::float as digital
         FROM pos_orders WHERE "branchId" = $1 AND "createdAt" >= $2 AND status = 'COMPLETED'`,
        [branchId, todayStart],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        shiftTotalSales = Math.round(stats[0].total || 0);
        shiftTransactionCount = stats[0].count || 0;
        cashSalesTotal = Math.round(stats[0].cash || 0);
        digitalSalesTotal = Math.round(stats[0].digital || 0);
      }
    } catch (e) {
      shiftTotalSales = 0;
      shiftTransactionCount = 0;
      cashSalesTotal = 0;
      digitalSalesTotal = 0;
    }

    return {
      page: 'pos-register',
      registerStatus,
      shiftTotalSales,
      shiftTransactionCount,
      cashSalesTotal,
      digitalSalesTotal,
      currency: 'NGN',
    };
  }
}
