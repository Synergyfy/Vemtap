import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class ReferralsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    _branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let totalReferralSignups = 0;

    try {
      const stats = await this.dataSource.query(
        `SELECT 
           COUNT(*)::int as signups
         FROM affiliate_referrals 
         WHERE "referredBusinessId" = (SELECT "businessId" FROM branches WHERE id = $1 LIMIT 1)`,
        [_branchId],
      ).catch(() => []);

      if (stats && stats.length > 0) {
        totalReferralSignups = stats[0].signups || 0;
      }
    } catch (e) {
      // safe fallback
      totalReferralSignups = 0;
    }

    return {
      page: 'referrals',
      totalReferralSignups,
      currency: 'NGN',
    };
  }
}
