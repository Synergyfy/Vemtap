import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { CashFlow, CashFlowType } from '../fos-core/entities/cash-flow.entity';
import { Expense } from '../fos-core/entities/expense.entity';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';

export interface CustomReportDto {
  dateRange?: '30days' | '90days' | '12months';
  category?: string;
  department?: string;
}

@Injectable()
export class FosReportsService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepo: Repository<CashFlow>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private formatNaira(value: number): string {
    return `N${Math.round(value).toLocaleString('en-NG')}`;
  }

  private formatChange(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? '+100.0%' : '+0.0%';
    }
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  private periodPrefix(days: number): string {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff.toISOString().split('T')[0];
  }

  async getReports() {
    const transactions = await this.transactionRepo.find();

    const revenueTx = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );
    const expenseTx = transactions.filter(
      (t) => t.type === FosTransactionType.EXPENSE,
    );
    const commissionTx = transactions.filter(
      (t) => t.type === FosTransactionType.COMMISSION,
    );

    const year = new Date().getFullYear();
    const yearPrefix = `${year}-`;
    const prevYearPrefix = `${year - 1}-`;

    const currentYearRevenue = revenueTx
      .filter((t) => t.date.startsWith(yearPrefix))
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);
    const prevYearRevenue = revenueTx
      .filter((t) => t.date.startsWith(prevYearPrefix))
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const currentYearCosts = [
      ...expenseTx.filter((t) => t.date.startsWith(yearPrefix)),
      ...commissionTx.filter((t) => t.date.startsWith(yearPrefix)),
    ].reduce((sum, t) => sum + this.toNumber(t.amount), 0);
    const prevYearCosts = [
      ...expenseTx.filter((t) => t.date.startsWith(prevYearPrefix)),
      ...commissionTx.filter((t) => t.date.startsWith(prevYearPrefix)),
    ].reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const currentYearProfit = currentYearRevenue - currentYearCosts;
    const prevYearProfit = prevYearRevenue - prevYearCosts;

    // MRR approximation: sum of monthly subscription revenue in the most
    // recent month that has data.
    const subTx = transactions.filter(
      (t) => t.type === FosTransactionType.SUBSCRIPTION,
    );
    const months = Array.from(
      new Set(subTx.map((t) => t.date.substring(0, 7))),
    ).sort();
    const latestMonth = months[months.length - 1];
    const mrr = latestMonth
      ? subTx
          .filter((t) => t.date.startsWith(latestMonth))
          .reduce((sum, t) => sum + this.toNumber(t.amount), 0)
      : 0;
    const arr = mrr * 12;

    return {
      reportSections: [
        {
          label: 'Total Revenue (YTD)',
          value: this.formatNaira(currentYearRevenue),
          change: this.formatChange(currentYearRevenue, prevYearRevenue),
        },
        {
          label: 'Net Profit',
          value: this.formatNaira(currentYearProfit),
          change: this.formatChange(currentYearProfit, prevYearProfit),
        },
      ],
      investorMetrics: [
        {
          label: 'Monthly Recurring Revenue',
          value: this.formatNaira(mrr),
        },
        {
          label: 'Annual Run Rate',
          value: this.formatNaira(arr),
        },
      ],
    };
  }

  async getManagementSummary() {
    const [transactions, cashflows, expenses, businesses] = await Promise.all([
      this.transactionRepo.find(),
      this.cashFlowRepo.find(),
      this.expenseRepo.find(),
      this.businessRepo.find(),
    ]);

    const revenue = transactions
      .filter(
        (t) =>
          t.type === FosTransactionType.SUBSCRIPTION ||
          t.type === FosTransactionType.SMS,
      )
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const expensesPaid = [
      ...transactions.filter((t) => t.type === FosTransactionType.EXPENSE),
      ...transactions.filter((t) => t.type === FosTransactionType.COMMISSION),
    ].reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const expensesTotal =
      expensesPaid +
      expenses.reduce((sum, e) => sum + this.toNumber(e.amount), 0);

    const profit = revenue - expensesTotal;

    const totalInflow = cashflows
      .filter((cf) => cf.type === CashFlowType.INFLOW)
      .reduce((sum, cf) => sum + this.toNumber(cf.amount), 0);
    const totalOutflow = cashflows
      .filter((cf) => cf.type === CashFlowType.OUTFLOW)
      .reduce((sum, cf) => sum + this.toNumber(cf.amount), 0);
    const cash = totalInflow - totalOutflow;

    const monthCount = Math.max(
      new Set(cashflows.map((cf) => cf.date.substring(0, 7))).size,
      1,
    );
    const monthlyBurn = totalOutflow / monthCount;
    const runwayMonths =
      monthlyBurn > 0 ? Math.round((cash / monthlyBurn) * 10) / 10 : 99;

    const customers = businesses.filter(
      (b) => b.status === BusinessStatus.ACTIVE,
    ).length;

    const activeBusinessIds = new Set(
      transactions
        .filter(
          (t) => t.businessId && t.type === FosTransactionType.SUBSCRIPTION,
        )
        .map((t) => t.businessId),
    );
    const activeBusinesses = activeBusinessIds.size || customers || 0;

    const revenueByMonth = new Map<string, number>();
    for (const t of transactions) {
      if (
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS
      ) {
        const month = t.date.substring(0, 7);
        revenueByMonth.set(
          month,
          (revenueByMonth.get(month) || 0) + this.toNumber(t.amount),
        );
      }
    }
    const sortedMonths = Array.from(revenueByMonth.keys()).sort();
    const latest =
      revenueByMonth.get(sortedMonths[sortedMonths.length - 1]) || 0;
    const previous =
      revenueByMonth.get(sortedMonths[sortedMonths.length - 2]) || 0;
    const growth =
      previous > 0
        ? Math.round(((latest - previous) / previous) * 1000) / 10
        : 0;

    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    if (runwayMonths >= 6 && margin >= 20) {
      riskLevel = 'Low';
    } else if (runwayMonths < 3 || margin < 0) {
      riskLevel = 'High';
    }

    return {
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expensesTotal * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      cash: Math.round(cash * 100) / 100,
      runwayMonths,
      customers: activeBusinesses,
      growth,
      riskLevel,
    };
  }

  async getCustomReport(dto: CustomReportDto) {
    const [transactions, expenses] = await Promise.all([
      this.transactionRepo.find(),
      this.expenseRepo.find(),
    ]);

    let revenueTx = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );
    let expenseTx = [
      ...transactions.filter((t) => t.type === FosTransactionType.EXPENSE),
      ...transactions.filter((t) => t.type === FosTransactionType.COMMISSION),
    ];
    let expenseRows = expenses;

    if (dto.dateRange) {
      const days =
        dto.dateRange === '30days' ? 30 : dto.dateRange === '90days' ? 90 : 365;
      const start = this.periodPrefix(days);
      revenueTx = revenueTx.filter((t) => t.date >= start);
      expenseTx = expenseTx.filter((t) => t.date >= start);
      expenseRows = expenseRows.filter((e) => e.date >= start);
    }

    if (dto.category) {
      const cat = dto.category.toLowerCase();
      revenueTx = revenueTx.filter((t) =>
        (t.description || '').toLowerCase().includes(cat),
      );
      expenseTx = expenseTx.filter((t) =>
        (t.description || '').toLowerCase().includes(cat),
      );
      expenseRows = expenseRows.filter((e) =>
        e.category.toLowerCase().includes(cat),
      );
    }

    const revenue = revenueTx.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );
    const expensesTotal =
      expenseTx.reduce((sum, t) => sum + this.toNumber(t.amount), 0) +
      expenseRows.reduce((sum, e) => sum + this.toNumber(e.amount), 0);
    const profit = revenue - expensesTotal;

    const monthlyTrend = new Map<
      string,
      { revenue: number; expenses: number }
    >();
    for (const t of revenueTx) {
      const month = t.date.substring(0, 7);
      const cur = monthlyTrend.get(month) || { revenue: 0, expenses: 0 };
      cur.revenue += this.toNumber(t.amount);
      monthlyTrend.set(month, cur);
    }
    for (const t of expenseTx) {
      const month = t.date.substring(0, 7);
      const cur = monthlyTrend.get(month) || { revenue: 0, expenses: 0 };
      cur.expenses += this.toNumber(t.amount);
      monthlyTrend.set(month, cur);
    }
    for (const e of expenseRows) {
      const month = e.date.substring(0, 7);
      const cur = monthlyTrend.get(month) || { revenue: 0, expenses: 0 };
      cur.expenses += this.toNumber(e.amount);
      monthlyTrend.set(month, cur);
    }

    const trend = Array.from(monthlyTrend.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue * 100) / 100,
        expenses: Math.round(v.expenses * 100) / 100,
        profit: Math.round((v.revenue - v.expenses) * 100) / 100,
      }));

    return {
      reportSections: [
        { label: 'Revenue', value: this.formatNaira(revenue) },
        { label: 'Expenses', value: this.formatNaira(expensesTotal) },
        { label: 'Net Profit', value: this.formatNaira(profit) },
      ],
      filters: {
        dateRange: dto.dateRange ?? '12months',
        category: dto.category ?? '',
        department: dto.department ?? '',
      },
      trend,
    };
  }
}
