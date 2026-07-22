import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class AnalyticsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let revenueThisMonth = 0;
    let revenuePrevMonth = 0;
    let revenueChangePercent = 0;
    let totalTransactions = 0;
    let avgTransactionValue = 0;
    let peakHour = 'N/A';

    try {
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const prevMonthStart = new Date(currentMonthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

      const revStats = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN "createdAt" >= $2 THEN total END), 0)::float as current_rev,
           COALESCE(SUM(CASE WHEN "createdAt" >= $3 AND "createdAt" < $2 THEN total END), 0)::float as prev_rev,
           COUNT(CASE WHEN "createdAt" >= $2 THEN 1 END)::int as tx_count
         FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED'`,
        [branchId, currentMonthStart, prevMonthStart],
      ).catch(() => []);

      const peakHourStats = await this.dataSource.query(
        `SELECT EXTRACT(HOUR FROM "orderedAt")::int as hour, COUNT(*)::int as count 
         FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED' 
         GROUP BY hour ORDER BY count DESC LIMIT 1`,
        [branchId],
      ).catch(() => []);

      if (peakHourStats && peakHourStats.length > 0) {
        const h = peakHourStats[0].hour;
        const start = h % 12 === 0 ? 12 : h % 12;
        const startAmPm = h >= 12 ? 'pm' : 'am';
        const next = (h + 1) % 24;
        const end = next % 12 === 0 ? 12 : next % 12;
        const endAmPm = next >= 12 ? 'pm' : 'am';
        peakHour = `${start}${startAmPm} - ${end}${endAmPm}`;
      }

      if (revStats && revStats.length > 0) {
        revenueThisMonth = Math.round(revStats[0].current_rev || 0);
        revenuePrevMonth = Math.round(revStats[0].prev_rev || 0);
        totalTransactions = revStats[0].tx_count || 0;
        avgTransactionValue = totalTransactions > 0 ? Math.round(revenueThisMonth / totalTransactions) : 0;

        if (revenuePrevMonth > 0) {
          revenueChangePercent = Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100);
        } else if (revenueThisMonth > 0) {
          revenueChangePercent = 100;
        }
      }
    } catch (e) {
      revenueThisMonth = 0;
      revenuePrevMonth = 0;
      revenueChangePercent = 0;
      totalTransactions = 0;
      avgTransactionValue = 0;
    }

    return {
      page: 'analytics',
      revenueThisMonth,
      revenuePrevMonth,
      revenueChangePercent,
      totalTransactions,
      avgTransactionValue,
      peakHour,
      currency: 'NGN',
    };
  }
}
