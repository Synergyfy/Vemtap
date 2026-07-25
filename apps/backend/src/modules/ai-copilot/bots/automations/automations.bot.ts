import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPageBot } from '../bot.interface';

@Injectable()
export class AutomationsBot implements IPageBot {
  constructor(private readonly dataSource: DataSource) {}

  async compute(
    _branchId: string,
    _context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let activeTriggersCount = 0;
    let welcomeAutomationsSent = 0;
    let winbackAutomationsSent = 0;
    let automationWinbackRate = 0;
    let topPerformingTrigger = 'None';

    try {
      const stats = await this.dataSource.query(
        `SELECT COUNT(*)::int as count FROM automation_rules WHERE "branchId" = $1 AND "isActive" = true`,
        [_branchId]
      ).catch(() => []);

      if (stats && stats.length > 0) {
        activeTriggersCount = stats[0].count || 0;
      }
    } catch (e) {
      activeTriggersCount = 0;
    }

    return {
      page: 'automations',
      activeTriggersCount,
      welcomeAutomationsSent,
      winbackAutomationsSent,
      automationWinbackRate,
      topPerformingTrigger,
    };
  }
}
