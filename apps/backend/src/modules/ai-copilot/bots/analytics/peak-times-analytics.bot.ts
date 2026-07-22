import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class PeakTimesAnalyticsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    _branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let peakWindow = 'N/A';
    let busiestDay = 'N/A';
    let avgVisitsPerPeakHour = 0;
    let recommendedStaffing = 'Pending data';
    let suggestedPromoWindow = 'N/A';

    try {
      const peakHourRes = await this.dataSource.query(
        `SELECT EXTRACT(HOUR FROM "orderedAt")::int as hour, COUNT(*)::int as count
         FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED'
         GROUP BY hour ORDER BY count DESC LIMIT 1`,
        [_branchId]
      ).catch(() => []);

      const busiestDayRes = await this.dataSource.query(
        `SELECT TO_CHAR("orderedAt", 'Day') as day_name, COUNT(*)::int as count
         FROM pos_sales WHERE "branchId" = $1 AND status = 'COMPLETED'
         GROUP BY day_name ORDER BY count DESC LIMIT 1`,
        [_branchId]
      ).catch(() => []);

      if (peakHourRes && peakHourRes.length > 0) {
        const h = peakHourRes[0].hour;
        const start = h % 12 === 0 ? 12 : h % 12;
        const startAmPm = h >= 12 ? 'pm' : 'am';
        const next = (h + 1) % 24;
        const end = next % 12 === 0 ? 12 : next % 12;
        const endAmPm = next >= 12 ? 'pm' : 'am';
        peakWindow = `${start}${startAmPm} - ${end}${endAmPm}`;
        avgVisitsPerPeakHour = peakHourRes[0].count;
        
        const offPeakHour = (h + 12) % 24;
        const offStart = offPeakHour % 12 === 0 ? 12 : offPeakHour % 12;
        const offStartAmPm = offPeakHour >= 12 ? 'pm' : 'am';
        suggestedPromoWindow = `${offStart}${offStartAmPm} (Off-peak boost)`;
        
        if (avgVisitsPerPeakHour > 50) recommendedStaffing = '4 Cashiers, 2 Support Staff';
        else if (avgVisitsPerPeakHour > 20) recommendedStaffing = '2 Cashiers, 1 Support Staff';
        else recommendedStaffing = '1 Cashier';
      }

      if (busiestDayRes && busiestDayRes.length > 0) {
        busiestDay = busiestDayRes[0].day_name.trim();
      }
    } catch (e) {
      // safe fallbacks already set
    }

    return {
      page: 'analytics-peak-times',
      peakWindow,
      busiestDay,
      avgVisitsPerPeakHour,
      recommendedStaffing,
      suggestedPromoWindow,
    };
  }
}
