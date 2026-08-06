import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class CustomersBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let totalCustomers = 0;
    let newCustomersThisMonth = 0;
    let repeatCustomerRate = 0;
    let churnRate = 0;
    let inactiveCount = 0;
    let averageSpend = 0;

    try {
      const [stats, spendStats] = await Promise.all([
        this.dataSource
          .query(
            `SELECT 
             COUNT(DISTINCT "customerId")::int as total,
             COUNT(DISTINCT CASE WHEN "createdAt" >= $2 THEN "customerId" END)::int as new_this_month,
             COUNT(DISTINCT CASE WHEN status = 'returning' THEN "customerId" END)::float / NULLIF(COUNT(DISTINCT "customerId"), 0) * 100 as repeat_rate,
             0 as churn_rate,
             0 as inactive_count
           FROM visits WHERE "branchId" = $1`,
            [branchId, thirtyDaysAgo],
          )
          .catch(() => []),
        this.dataSource
          .query(
            `SELECT COALESCE(AVG(total), 0)::float as avg_spend FROM pos_sales WHERE "branchId" = $1 AND "customerId" IS NOT NULL`,
            [branchId],
          )
          .catch(() => []),
      ]);

      if (stats && stats.length > 0) {
        totalCustomers = stats[0].total || 0;
        newCustomersThisMonth = stats[0].new_this_month || 0;
        inactiveCount = stats[0].inactive_count || 0;
        averageSpend = Math.round(spendStats?.[0]?.avg_spend || 0);

        if (totalCustomers === 0) {
          repeatCustomerRate = 0;
          churnRate = 0;
        } else {
          repeatCustomerRate = Math.round(stats[0].repeat_rate ?? 0);
          churnRate = Math.round(stats[0].churn_rate ?? 0);
        }
      }
    } catch (e) {
      totalCustomers = 0;
      newCustomersThisMonth = 0;
      repeatCustomerRate = 0;
      churnRate = 0;
      inactiveCount = 0;
      averageSpend = 0;
    }

    return {
      page: 'customers',
      totalCustomers,
      newCustomersThisMonth,
      repeatCustomerRate,
      churnRate,
      inactiveCount,
      averageSpend,
      currency: 'NGN',
    };
  }
}
