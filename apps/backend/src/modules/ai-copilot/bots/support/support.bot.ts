import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class SupportBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    _branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let totalTicketsCount = 0;
    let openTicketsCount = 0;
    let avgResolutionTimeHours = 0;
    let csatScore = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT 
           COUNT(*)::int as total,
           COUNT(CASE WHEN status != 'Resolved' AND status != 'Cancelled' THEN 1 END)::int as open_count
         FROM support_tickets 
         WHERE "userId" IN (SELECT id FROM users WHERE "branchId" = $1)`,
        [_branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        totalTicketsCount = stats[0].total || 0;
        openTicketsCount = stats[0].open_count || 0;
      }
    } catch (e) {
      // safe fallback
      totalTicketsCount = 0;
      openTicketsCount = 0;
    }

    return {
      page: 'support',
      totalTicketsCount,
      openTicketsCount,
      avgResolutionTimeHours,
      csatScore,
    };
  }
}
