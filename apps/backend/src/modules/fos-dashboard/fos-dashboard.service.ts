import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { MetricsSnapshot } from './entities/metrics-snapshot.entity';
import {
  DashboardStatsResponseDto,
  DashboardSnapshotDto,
  DashboardInsightDto,
} from './dto/dashboard.dto';

@Injectable()
export class FosDashboardService {
  private readonly logger = new Logger(FosDashboardService.name);

  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(MetricsSnapshot)
    private readonly snapshotRepo: Repository<MetricsSnapshot>,
  ) {}

  async getStats(): Promise<DashboardStatsResponseDto> {
    const allTransactions = await this.transactionRepo.find();
    const totalRevenue = allTransactions.reduce(
      (sum, t) =>
        sum +
        (t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS
          ? Number(t.amount)
          : 0),
      0,
    );
    const netProfit = allTransactions.reduce(
      (sum, t) => sum + Number(t.profit),
      0,
    );
    const smsSent = allTransactions
      .filter((t) => t.type === FosTransactionType.SMS)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const vemtapRevenue = allTransactions
      .filter(
        (t) =>
          t.platform === FosPlatform.VEMTAP &&
          t.type === FosTransactionType.SUBSCRIPTION,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const qrthriveRevenue = allTransactions
      .filter((t) => t.platform === FosPlatform.QRTHRIVE)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const commissionsPaid = allTransactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const uniqueBusinesses = new Set(
      allTransactions
        .filter((t) => t.businessId)
        .map((t) => t.businessId),
    ).size;
    const uniqueAgents = new Set(
      allTransactions
        .filter((t) => t.agentId)
        .map((t) => t.agentId),
    ).size;

    const snapshots = await this.snapshotRepo.find({
      order: { date: 'DESC' },
      take: 1,
    });
    const latestSnapshot = snapshots[0] ?? null;

    const cashInflows = allTransactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const cashOutflows = allTransactions
      .filter((t) => Number(t.cost) > 0)
      .reduce((sum, t) => sum + Number(t.cost), 0);

    return {
      totalRevenue,
      netProfit,
      totalBusinesses: uniqueBusinesses,
      activeAgents: uniqueAgents,
      smsSent: Math.round(smsSent),
      vemtapRevenue,
      qrthriveRevenue,
      commissionsPaid,
      cashBalance: cashInflows - cashOutflows,
      churnRate: latestSnapshot ? Number(latestSnapshot.churnRate) : 0,
      conversionRate: latestSnapshot ? Number(latestSnapshot.conversionRate) : 0,
    };
  }

  async getSnapshots(): Promise<DashboardSnapshotDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const snapshots = await this.snapshotRepo.find({
      where: {
        date: Between(
          thirtyDaysAgo.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
        ),
      },
      order: { date: 'ASC' },
    });

    return snapshots.map((s) => ({
      date: s.date,
      totalRevenue: Number(s.totalRevenue),
      totalProfit: Number(s.totalProfit),
      totalBusinesses: s.totalBusinesses,
      churnRate: Number(s.churnRate),
      conversionRate: Number(s.conversionRate),
    }));
  }

  async getInsights(): Promise<DashboardInsightDto[]> {
    const insights: DashboardInsightDto[] = [];
    const transactions = await this.transactionRepo.find();

    const agentRevenues = new Map<string, number>();
    for (const t of transactions) {
      if (t.agentId && t.type === FosTransactionType.SUBSCRIPTION) {
        const current = agentRevenues.get(t.agentId) || 0;
        agentRevenues.set(t.agentId, current + Number(t.amount));
      }
    }

    let bestAgentId: string | undefined;
    let bestAgentRevenue = 0;
    for (const [agentId, revenue] of agentRevenues) {
      if (revenue > bestAgentRevenue) {
        bestAgentRevenue = revenue;
        bestAgentId = agentId;
      }
    }

    if (bestAgentId) {
      insights.push({
        type: 'HIGH_PERFORMANCE',
        title: 'Best Performing Agent',
        message: `Agent ${bestAgentId.slice(0, 8)} generated NGN ${bestAgentRevenue.toLocaleString()} in MRR this month`,
        severity: 'SUCCESS',
      });
    }

    const smsUsage = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === FosTransactionType.SMS && t.businessId) {
        const current = smsUsage.get(t.businessId) || 0;
        smsUsage.set(t.businessId, current + Number(t.amount));
      }
    }

    for (const [businessId, usage] of smsUsage) {
      if (usage >= 4000) {
        insights.push({
          type: 'SMS_ALERT',
          title: 'High SMS Usage Alert',
          message: `Business ${businessId.slice(0, 8)} has used ${usage.toLocaleString()} SMS credits`,
          severity: 'WARNING',
        });
      }
    }

    const totalInflow = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalOutflow = transactions
      .filter((t) => Number(t.cost) > 0)
      .reduce((sum, t) => sum + Number(t.cost), 0);
    const cashBalance = totalInflow - totalOutflow;
    const monthlyBurn = transactions
      .filter((t) => t.type === FosTransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (monthlyBurn > 0 && cashBalance > 0) {
      const runwayMonths = cashBalance / monthlyBurn;
      if (runwayMonths < 3) {
        insights.push({
          type: 'FINANCIAL_RUNWAY',
          title: 'Cash Runway Critical',
          message: `You may run out of cash in ${runwayMonths.toFixed(1)} months. Current balance: NGN ${cashBalance.toLocaleString()}`,
          severity: 'DANGER',
        });
      } else if (runwayMonths < 6) {
        insights.push({
          type: 'FINANCIAL_RUNWAY',
          title: 'Cash Runway Warning',
          message: `You have approximately ${runwayMonths.toFixed(1)} months of runway remaining`,
          severity: 'WARNING',
        });
      } else {
        insights.push({
          type: 'FINANCIAL_RUNWAY',
          title: 'Healthy Runway',
          message: `You have approximately ${runwayMonths.toFixed(1)} months of runway remaining`,
          severity: 'SUCCESS',
        });
      }
    }

    return insights;
  }
}
