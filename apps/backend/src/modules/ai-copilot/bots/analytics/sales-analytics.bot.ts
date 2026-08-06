import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class SalesAnalyticsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let grossRevenue30d = 0;
    let totalCompletedOrders = 0;
    let averageTicketSize = 0;
    let topPaymentMethod = 'Card / POS';
    let topRevenueDay = 'Saturday';

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [stats, topPaymentRes, topDayRes] = await Promise.all([
        this.dataSource
          .query(
            `SELECT 
             COALESCE(SUM(total), 0)::float as rev,
             COUNT(*)::int as count
           FROM pos_sales WHERE "branchId" = $1 AND "orderedAt" >= $2 AND status = 'COMPLETED'`,
            [branchId, thirtyDaysAgo],
          )
          .catch(() => []),
        this.dataSource
          .query(
            `SELECT "paymentMethod", COUNT(*)::int as count 
           FROM pos_sales WHERE "branchId" = $1 AND "orderedAt" >= $2 AND status = 'COMPLETED'
           GROUP BY "paymentMethod" ORDER BY count DESC LIMIT 1`,
            [branchId, thirtyDaysAgo],
          )
          .catch(() => []),
        this.dataSource
          .query(
            `SELECT TO_CHAR("orderedAt", 'Day') as day_name, SUM(total) as rev
           FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED'
           GROUP BY day_name ORDER BY rev DESC LIMIT 1`,
            [branchId],
          )
          .catch(() => []),
      ]);

      if (stats && stats.length > 0) {
        grossRevenue30d = Math.round(stats[0].rev || 0);
        totalCompletedOrders = stats[0].count || 0;
        averageTicketSize =
          totalCompletedOrders > 0
            ? Math.round(grossRevenue30d / totalCompletedOrders)
            : 0;
      }

      if (topPaymentRes && topPaymentRes.length > 0) {
        topPaymentMethod = topPaymentRes[0].paymentMethod;
      } else {
        topPaymentMethod = 'N/A';
      }

      if (topDayRes && topDayRes.length > 0) {
        topRevenueDay = topDayRes[0].day_name.trim();
      } else {
        topRevenueDay = 'N/A';
      }
    } catch (e) {
      grossRevenue30d = 0;
      totalCompletedOrders = 0;
      averageTicketSize = 0;
      topPaymentMethod = 'N/A';
      topRevenueDay = 'N/A';
    }

    return {
      page: 'analytics-sales',
      grossRevenue30d,
      totalCompletedOrders,
      averageTicketSize,
      topPaymentMethod,
      topRevenueDay,
      currency: 'NGN',
    };
  }
}
