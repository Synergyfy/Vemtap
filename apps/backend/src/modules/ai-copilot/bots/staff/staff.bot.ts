import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class StaffBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    _branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let activeStaffCount = 0;
    let topStaffByRevenue = 'None';
    let activeShiftCount = 0;

    try {
      const staffStats = await this.dataSource.query(
        `SELECT COUNT(*)::int as count FROM users WHERE "branchId" = $1 AND (role = 'Staff' OR "roleTag" IS NOT NULL)`,
        [_branchId]
      ).catch(() => []);

      const topStaffStats = await this.dataSource.query(
        `SELECT u."firstName", u."lastName", SUM(s.total) as revenue 
         FROM pos_sales s
         JOIN users u ON u.id = s."cashierId"
         WHERE s."branchId" = $1 AND s.status = 'COMPLETED'
         GROUP BY u.id
         ORDER BY revenue DESC LIMIT 1`,
        [_branchId]
      ).catch(() => []);

      if (staffStats && staffStats.length > 0) {
        activeStaffCount = staffStats[0].count || 0;
      }

      if (topStaffStats && topStaffStats.length > 0) {
        topStaffByRevenue = `${topStaffStats[0].firstName} ${topStaffStats[0].lastName}`.trim();
      }
    } catch (e) {
      activeStaffCount = 0;
      topStaffByRevenue = 'None';
    }

    return {
      page: 'staff',
      activeStaffCount,
      topStaffByRevenue,
      activeShiftCount,
    };
  }
}
