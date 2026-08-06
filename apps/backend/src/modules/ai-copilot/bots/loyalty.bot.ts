import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from './bot.interface';

@Injectable()
export class LoyaltyBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let activeMembers = 0;
    let totalPointsAwarded = 0;
    let totalPointsRedeemed = 0;

    try {
      const stats = await this.dataSource
        .query(
          `SELECT 
           COUNT(DISTINCT "customerId")::int as members,
           COALESCE(SUM(CASE WHEN type = 'earned' THEN amount END), 0)::int as awarded,
           COALESCE(SUM(CASE WHEN type = 'redeemed' THEN amount END), 0)::int as redeemed
         FROM point_transactions WHERE "branchId" = $1`,
          [branchId],
        )
        .catch(() => []);

      if (stats && stats.length > 0) {
        activeMembers = stats[0].members || 0;
        totalPointsAwarded = stats[0].awarded || 0;
        totalPointsRedeemed = stats[0].redeemed || 0;
      }
    } catch (e) {
      activeMembers = 0;
      totalPointsAwarded = 0;
      totalPointsRedeemed = 0;
    }

    return {
      page: 'loyalty',
      activeMembers,
      totalPointsAwarded,
      totalPointsRedeemed,
      redemptionRate:
        totalPointsAwarded > 0
          ? Math.round((totalPointsRedeemed / totalPointsAwarded) * 100)
          : 0,
    };
  }
}
