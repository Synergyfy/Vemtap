import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class DashboardBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let totalCustomers = 0;
    let totalRevenue = 0;
    let repeatCustomerRate = 0;
    let churnRate = 0;
    let lowStockCount = 0;
    let activeCampaigns = 0;

    try {
      const [
        visitorCountRes,
        posRevenueRes,
        repeatRes,
        lowStockRes,
        campaignRes,
      ] = await Promise.all([
        this.dataSource
          .query(
            `SELECT COUNT(*)::int as count FROM visits WHERE "branchId" = $1`,
            [branchId],
          )
          .catch(() => [{ count: 0 }]),
        this.dataSource
          .query(
            `SELECT COALESCE(SUM(total), 0)::float as revenue FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED'`,
            [branchId],
          )
          .catch(() => [{ revenue: 0 }]),
        this.dataSource
          .query(
            `SELECT 
             COUNT(CASE WHEN status = 'returning' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as repeat_rate,
             0 as churn_rate
           FROM visits WHERE "branchId" = $1 AND "createdAt" >= $2`,
            [branchId, thirtyDaysAgo],
          )
          .catch(() => [{ repeat_rate: 0, churn_rate: 0 }]),
        this.dataSource
          .query(
            `SELECT COUNT(*)::int as count FROM products WHERE "branchId" = $1 AND stock <= "lowStockThreshold"`,
            [branchId],
          )
          .catch(() => [{ count: 0 }]),
        this.dataSource
          .query(
            `SELECT COUNT(*)::int as count FROM campaigns WHERE "branchId" = $1 AND status = 'ACTIVE'`,
            [branchId],
          )
          .catch(() => [{ count: 0 }]),
      ]);

      totalCustomers = visitorCountRes[0]?.count || 0;
      totalRevenue = Math.round(posRevenueRes[0]?.revenue || 0);

      if (totalCustomers === 0) {
        repeatCustomerRate = 0;
        churnRate = 0;
      } else {
        repeatCustomerRate = Math.round(repeatRes[0]?.repeat_rate ?? 0);
        churnRate = Math.round(repeatRes[0]?.churn_rate ?? 0);
      }

      lowStockCount = lowStockRes[0]?.count || 0;
      activeCampaigns = campaignRes[0]?.count || 0;
    } catch (e) {
      // Fallback default safe metrics if schema/tables differ slightly
      totalCustomers = totalCustomers || 0;
      totalRevenue = totalRevenue || 0;
      repeatCustomerRate = 0;
      churnRate = 0;
    }

    return {
      page: 'dashboard',
      totalCustomers,
      totalRevenue,
      repeatCustomerRate,
      churnRate,
      lowStockCount,
      activeCampaigns,
      currency: 'NGN',
    };
  }
}
