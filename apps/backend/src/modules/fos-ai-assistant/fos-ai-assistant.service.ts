import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';

export interface ChatDataRow {
  label: string;
  value: string;
}

@Injectable()
export class FosAiAssistantService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private formatNaira(value: number): string {
    return `₦${Math.round(value).toLocaleString('en-NG')}`;
  }

  private async computeAggregates() {
    const transactions = await this.transactionRepo.find();

    const revenueTx = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );
    const grossRevenue = revenueTx.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );
    const gatewayCost = revenueTx.reduce(
      (sum, t) => sum + this.toNumber(t.cost),
      0,
    );
    const commissionPaid = transactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);
    const opexPaid = transactions
      .filter((t) => t.type === FosTransactionType.EXPENSE)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);
    const netProfit = grossRevenue - gatewayCost - commissionPaid - opexPaid;

    const months = Array.from(
      new Set(transactions.map((t) => t.date.substring(0, 7))),
    ).sort();
    const latestMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];

    const monthRevenue = (month?: string) =>
      month
        ? revenueTx
            .filter((t) => t.date.startsWith(month))
            .reduce((sum, t) => sum + this.toNumber(t.amount), 0)
        : 0;

    const latestRevenue = monthRevenue(latestMonth);
    const prevRevenue = monthRevenue(prevMonth);
    const revenueGrowth =
      prevRevenue > 0 ? ((latestRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const expenses = transactions.filter(
      (t) => t.type === FosTransactionType.EXPENSE,
    );
    const expenseByCategory = new Map<string, number>();
    for (const t of expenses) {
      expenseByCategory.set(
        t.description || 'Other',
        (expenseByCategory.get(t.description || 'Other') || 0) +
          this.toNumber(t.amount),
      );
    }
    const topExpense = Array.from(expenseByCategory.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const monthlyBurn = commissionPaid + opexPaid;
    const runwayMonths = monthlyBurn > 0 ? netProfit / monthlyBurn : 0;

    return {
      grossRevenue,
      netProfit,
      commissionPaid,
      opexPaid,
      revenueGrowth,
      latestRevenue,
      prevRevenue,
      monthlyBurn,
      runwayMonths,
      topExpense,
      marginPercent: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
    };
  }

  async getInsights() {
    const agg = await this.computeAggregates();
    const insights: {
      icon: string;
      text: string;
      type: string;
    }[] = [];

    insights.push({
      icon: agg.revenueGrowth >= 0 ? 'trending-up' : 'trending-down',
      text: `Revenue is ${
        agg.revenueGrowth >= 0 ? 'growing' : 'declining'
      } at ${Math.abs(agg.revenueGrowth).toFixed(1)}% month-over-month.`,
      type: agg.revenueGrowth >= 0 ? 'positive' : 'warning',
    });

    insights.push({
      icon: agg.marginPercent >= 0 ? 'check-circle' : 'alert-triangle',
      text: `Current net profit margin is ${agg.marginPercent.toFixed(1)}%.`,
      type: agg.marginPercent >= 0 ? 'positive' : 'warning',
    });

    if (agg.runwayMonths < 6) {
      insights.push({
        icon: 'alert-triangle',
        text: `Cash runway is estimated at ${Math.max(
          0,
          Math.round(agg.runwayMonths * 10) / 10,
        )} months.`,
        type: 'warning',
      });
    }

    if (agg.topExpense) {
      insights.push({
        icon: 'trending-down',
        text: `${agg.topExpense[0]} is your largest expense at ${this.formatNaira(
          agg.topExpense[1],
        )}.`,
        type: 'warning',
      });
    }

    return {
      insights,
      predefinedQuestions: [
        'How much did we spend on marketing last month?',
        'Can we afford to hire a developer?',
        'What is our break-even point?',
        'Which product is most profitable?',
        'Why did expenses increase?',
      ],
    };
  }

  async chat(query: string): Promise<{ answer: string; data: ChatDataRow[] }> {
    const agg = await this.computeAggregates();
    const q = query.toLowerCase();

    if (q.includes('hire') || q.includes('afford') || q.includes('developer')) {
      const monthlyCost = 300000;
      const impact =
        agg.monthlyBurn > 0 ? (monthlyCost / agg.monthlyBurn) * 100 : 0;
      const runwayAfter =
        agg.monthlyBurn + monthlyCost > 0
          ? agg.netProfit / (agg.monthlyBurn + monthlyCost)
          : 0;
      return {
        answer: `A new developer at ${this.formatNaira(
          monthlyCost,
        )}/month would increase monthly burn by ${impact.toFixed(
          1,
        )}% and reduce runway to about ${Math.max(
          0,
          Math.round(runwayAfter * 10) / 10,
        )} months based on current net profit.`,
        data: [
          { label: 'Monthly Cost', value: this.formatNaira(monthlyCost) },
          { label: 'Burn Impact', value: `${impact.toFixed(1)}%` },
          {
            label: 'Runway After',
            value: `${Math.max(0, Math.round(runwayAfter * 10) / 10)} months`,
          },
        ],
      };
    }

    if (
      q.includes('spend') ||
      q.includes('marketing') ||
      q.includes('expense')
    ) {
      return {
        answer: `Total operating expenses are ${this.formatNaira(
          agg.opexPaid,
        )} with commissions at ${this.formatNaira(agg.commissionPaid)}.`,
        data: [
          {
            label: 'Operating Expenses',
            value: this.formatNaira(agg.opexPaid),
          },
          { label: 'Commissions', value: this.formatNaira(agg.commissionPaid) },
          { label: 'Monthly Burn', value: this.formatNaira(agg.monthlyBurn) },
        ],
      };
    }

    if (q.includes('break-even') || q.includes('break even')) {
      const target = Math.max(agg.monthlyBurn, 1);
      return {
        answer: `You break even when monthly revenue covers ${this.formatNaira(
          target,
        )}. Current monthly revenue is ${this.formatNaira(
          agg.latestRevenue,
        )}, so you are ${
          agg.latestRevenue >= target ? 'above' : 'below'
        } break-even.`,
        data: [
          { label: 'Break-even Revenue', value: this.formatNaira(target) },
          {
            label: 'Current Revenue',
            value: this.formatNaira(agg.latestRevenue),
          },
          {
            label: 'Profitability',
            value: agg.netProfit >= 0 ? 'Profitable' : 'Loss-making',
          },
        ],
      };
    }

    if (q.includes('profit') || q.includes('margin') || q.includes('product')) {
      return {
        answer: `Net profit is ${this.formatNaira(agg.netProfit)} on gross revenue of ${this.formatNaira(
          agg.grossRevenue,
        )} (${agg.marginPercent.toFixed(1)}% margin). Subscriptions and SMS are the primary revenue drivers.`,
        data: [
          { label: 'Gross Revenue', value: this.formatNaira(agg.grossRevenue) },
          { label: 'Net Profit', value: this.formatNaira(agg.netProfit) },
          { label: 'Margin', value: `${agg.marginPercent.toFixed(1)}%` },
        ],
      };
    }

    if (q.includes('runway') || q.includes('cash')) {
      return {
        answer: `With monthly burn of ${this.formatNaira(
          agg.monthlyBurn,
        )} and net profit of ${this.formatNaira(
          agg.netProfit,
        )}, the estimated cash runway is ${Math.max(
          0,
          Math.round(agg.runwayMonths * 10) / 10,
        )} months.`,
        data: [
          { label: 'Monthly Burn', value: this.formatNaira(agg.monthlyBurn) },
          {
            label: 'Runway',
            value: `${Math.max(0, Math.round(agg.runwayMonths * 10) / 10)} months`,
          },
        ],
      };
    }

    return {
      answer: `Revenue is ${this.formatNaira(
        agg.grossRevenue,
      )} with net profit of ${this.formatNaira(
        agg.netProfit,
      )} and a ${agg.marginPercent.toFixed(1)}% margin.`,
      data: [
        { label: 'Revenue', value: this.formatNaira(agg.grossRevenue) },
        { label: 'Net Profit', value: this.formatNaira(agg.netProfit) },
        { label: 'Margin', value: `${agg.marginPercent.toFixed(1)}%` },
      ],
    };
  }
}
