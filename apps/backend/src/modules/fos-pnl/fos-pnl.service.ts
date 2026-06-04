import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { Expense } from '../fos-core/entities/expense.entity';
import { CashFlow, CashFlowType } from '../fos-core/entities/cash-flow.entity';
import { MetricsSnapshot } from '../fos-dashboard/entities/metrics-snapshot.entity';
import { BreakEvenResponseDto, RunwayResponseDto } from './dto/pnl.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { CreateCashFlowDto } from './dto/create-cashflow.dto';
import { ListCashFlowsQueryDto } from './dto/list-cashflows-query.dto';
import {
  PnlStatementResponseDto,
  RevenueTrendDto,
  CashFlowRunwayResponseDto,
  CostBreakEvenResponseDto,
  ExpenseResponseDto,
  CashFlowEntryDto,
} from './dto/pnl-response.dto';

@Injectable()
export class FosPnlService {
  private readonly logger = new Logger(FosPnlService.name);

  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(MetricsSnapshot)
    private readonly snapshotRepo: Repository<MetricsSnapshot>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepo: Repository<CashFlow>,
  ) {}

  toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  // ==================== Existing Endpoints (unchanged) ====================

  async getBreakEven(): Promise<BreakEvenResponseDto> {
    const transactions = await this.transactionRepo.find();

    const revenueTransactions = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );
    const grossRevenue = revenueTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const expenseTransactions = transactions.filter(
      (t) => t.type === FosTransactionType.EXPENSE,
    );
    const totalCosts = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const commissionTransactions = transactions.filter(
      (t) => t.type === FosTransactionType.COMMISSION,
    );
    const totalCommissions = commissionTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const totalMonthlyCosts = totalCosts + totalCommissions;
    const monthlyFixedCosts = totalCosts;

    const activeBusinessIds = new Set(
      transactions
        .filter((t) => t.businessId && t.type === FosTransactionType.SUBSCRIPTION)
        .map((t) => t.businessId),
    );
    const activeBusinesses = activeBusinessIds.size || 1;

    const arpu = activeBusinesses > 0 ? grossRevenue / activeBusinesses : 0;

    const commissionRate =
      grossRevenue > 0 ? totalCommissions / grossRevenue : 0;
    const breakEvenRevenue =
      commissionRate < 1
        ? monthlyFixedCosts / (1 - commissionRate)
        : monthlyFixedCosts / 0.5;
    const breakEvenBusinesses =
      arpu > 0 ? Math.ceil(breakEvenRevenue / arpu) : 0;
    const progressPercent =
      breakEvenRevenue > 0
        ? Math.round((grossRevenue / breakEvenRevenue) * 10000) / 100
        : 0;
    const remainingGap = Math.max(0, breakEvenRevenue - grossRevenue);
    const isProfitable = grossRevenue > 0 && grossRevenue >= breakEvenRevenue;

    return {
      activeBusinesses,
      arpu: Math.round(arpu * 100) / 100,
      breakEvenBusinesses,
      breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
      progressPercent,
      remainingGap: Math.round(remainingGap * 100) / 100,
      isProfitable,
      totalMonthlyCosts: Math.round(totalMonthlyCosts * 100) / 100,
      monthlyFixedCosts: Math.round(monthlyFixedCosts * 100) / 100,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
    };
  }

  async getRunway(): Promise<RunwayResponseDto> {
    const transactions = await this.transactionRepo.find();

    const inflow = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const outflow = transactions
      .filter((t) => Number(t.cost) > 0)
      .reduce((sum, t) => sum + Number(t.cost), 0);

    const expenseTotal = transactions
      .filter((t) => t.type === FosTransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const commissionTotal = transactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyBurnRate = expenseTotal + commissionTotal;
    const monthlyNetCashFlow = inflow - outflow;
    const closingCashBalance = inflow - outflow;
    const openingCashBalance = closingCashBalance + monthlyNetCashFlow;

    const runwayMonths =
      monthlyBurnRate > 0 ? closingCashBalance / monthlyBurnRate : 0;

    return {
      openingCashBalance: Math.round(openingCashBalance * 100) / 100,
      closingCashBalance: Math.round(closingCashBalance * 100) / 100,
      monthlyNetCashFlow: Math.round(monthlyNetCashFlow * 100) / 100,
      monthlyBurnRate: Math.round(monthlyBurnRate * 100) / 100,
      runwayMonths: Math.round(runwayMonths * 100) / 100,
    };
  }

  // ==================== New: Expenses ====================

  async listExpenses(query: ListExpensesQueryDto) {
    const qb = this.expenseRepo.createQueryBuilder('e')
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    if (query.category) {
      qb.andWhere('e.category ILIKE :category', { category: `%${query.category}%` });
    }

    const total = await qb.getCount();
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const expenses = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return {
      success: true,
      data: {
        expenses: expenses.map((e) => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          frequency: e.frequency,
          date: e.date,
          createdAt: e.createdAt,
        })),
        total,
      },
    };
  }

  async createExpense(dto: CreateExpenseDto) {
    const expense = this.expenseRepo.create({
      category: dto.category,
      amount: dto.amount,
      frequency: dto.frequency,
      date: dto.date || new Date().toISOString().split('T')[0],
    });
    const saved = await this.expenseRepo.save(expense);

    const cashFlow = this.cashFlowRepo.create({
      type: CashFlowType.OUTFLOW,
      category: dto.category,
      amount: dto.amount,
      date: dto.date || new Date().toISOString().split('T')[0],
    });
    await this.cashFlowRepo.save(cashFlow);

    return {
      success: true,
      data: {
        id: saved.id,
        category: saved.category,
        amount: Number(saved.amount),
        frequency: saved.frequency,
        date: saved.date,
        createdAt: saved.createdAt,
      },
    };
  }

  // ==================== New: P&L Statement ====================

  async getPnlStatement(): Promise<{ success: boolean; data: PnlStatementResponseDto }> {
    const transactions = await this.transactionRepo.find();

    const revenueTransactions = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS ||
        t.type === FosTransactionType.COMMISSION,
    );
    const grossRevenue = revenueTransactions.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );

    const allTransactions = transactions;

    const gatewayCost = allTransactions.reduce(
      (sum, t) => sum + this.toNumber(t.cost),
      0,
    );

    const commissionPaid = allTransactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const opexPaid = allTransactions
      .filter((t) => t.type === FosTransactionType.EXPENSE)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const netProfit = grossRevenue - gatewayCost - commissionPaid - opexPaid;
    const profitMarginPercentage =
      grossRevenue > 0
        ? Math.round(((netProfit / grossRevenue) * 100) * 10) / 10
        : 0;

    return {
      success: true,
      data: {
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        gatewayCost: Math.round(gatewayCost * 100) / 100,
        commissionPaid: Math.round(commissionPaid * 100) / 100,
        opexPaid: Math.round(opexPaid * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMarginPercentage,
      },
    };
  }

  // ==================== New: Revenue Trends (Monthly) ====================

  async getRevenueTrends(): Promise<{ success: boolean; data: RevenueTrendDto[] }> {
    const transactions = await this.transactionRepo.find({
      where: [
        { type: FosTransactionType.SUBSCRIPTION },
        { type: FosTransactionType.SMS },
      ],
    });

    const monthlyMap = new Map<string, { revenue: number; profit: number }>();

    for (const t of transactions) {
      const month = t.date.substring(0, 7);
      const existing = monthlyMap.get(month) || { revenue: 0, profit: 0 };
      const amount = this.toNumber(t.amount);
      const profit = amount - this.toNumber(t.cost);
      existing.revenue += amount;
      existing.profit += profit;
      monthlyMap.set(month, existing);
    }

    const trends: RevenueTrendDto[] = Array.from(monthlyMap.entries())
      .map(([date, { revenue, profit }]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: trends };
  }

  // ==================== New: Cash Flows ====================

  async listCashflows(query: ListCashFlowsQueryDto) {
    const qb = this.cashFlowRepo.createQueryBuilder('cf')
      .orderBy('cf.date', 'DESC')
      .addOrderBy('cf.createdAt', 'DESC');

    if (query.type) {
      qb.andWhere('cf.type = :type', { type: query.type });
    }

    const total = await qb.getCount();
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const cashflows = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return {
      success: true,
      data: {
        cashflows: cashflows.map((cf) => ({
          id: cf.id,
          type: cf.type,
          category: cf.category,
          amount: Number(cf.amount),
          date: cf.date,
          createdAt: cf.createdAt,
        })),
        total,
      },
    };
  }

  async createCashflow(dto: CreateCashFlowDto) {
    const cashFlow = this.cashFlowRepo.create({
      type: dto.type,
      category: dto.category,
      amount: dto.amount,
      date: dto.date || new Date().toISOString().split('T')[0],
    });
    const saved = await this.cashFlowRepo.save(cashFlow);

    return {
      success: true,
      data: {
        id: saved.id,
        type: saved.type,
        category: saved.category,
        amount: Number(saved.amount),
        date: saved.date,
        createdAt: saved.createdAt,
      },
    };
  }

  // ==================== New: Cash Flow Runway ====================

  async getCashFlowRunway(): Promise<{ success: boolean; data: CashFlowRunwayResponseDto }> {
    const cashflows = await this.cashFlowRepo.find();

    let totalInflow = 0;
    let totalOutflow = 0;
    const monthsSet = new Set<string>();

    for (const cf of cashflows) {
      const amount = this.toNumber(cf.amount);
      if (cf.type === CashFlowType.INFLOW) {
        totalInflow += amount;
      } else {
        totalOutflow += amount;
      }
      monthsSet.add(cf.date.substring(0, 7));
    }

    const monthCount = Math.max(monthsSet.size, 1);
    const closingCashBalance = totalInflow - totalOutflow;

    const currentMonth = new Date().toISOString().substring(0, 7);
    let openingInflow = 0;
    let openingOutflow = 0;
    for (const cf of cashflows) {
      if (cf.date.substring(0, 7) < currentMonth) {
        const amount = this.toNumber(cf.amount);
        if (cf.type === CashFlowType.INFLOW) {
          openingInflow += amount;
        } else {
          openingOutflow += amount;
        }
      }
    }
    const openingCashBalance = openingInflow - openingOutflow;

    const monthlyNetCashFlow = (totalInflow - totalOutflow) / monthCount;
    const monthlyBurnRate = totalOutflow / monthCount;
    const runwayMonths =
      monthlyNetCashFlow >= 0
        ? 99
        : Math.min(99, Math.floor(closingCashBalance / Math.abs(monthlyNetCashFlow)));

    return {
      success: true,
      data: {
        openingCashBalance: Math.round(openingCashBalance * 100) / 100,
        closingCashBalance: Math.round(closingCashBalance * 100) / 100,
        monthlyNetCashFlow: Math.round(monthlyNetCashFlow * 100) / 100,
        monthlyBurnRate: Math.round(monthlyBurnRate * 100) / 100,
        runwayMonths,
      },
    };
  }

  // ==================== New: Cost Break-Even ====================

  async getCostBreakEven(): Promise<{ success: boolean; data: CostBreakEvenResponseDto }> {
    const cashflows = await this.cashFlowRepo.find();
    const transactions = await this.transactionRepo.find();

    let totalOutflow = 0;
    let opexTotal = 0;
    const monthsSet = new Set<string>();

    for (const cf of cashflows) {
      const amount = this.toNumber(cf.amount);
      totalOutflow += amount;
      monthsSet.add(cf.date.substring(0, 7));
    }

    const expenses = await this.expenseRepo.find();
    for (const e of expenses) {
      opexTotal += this.toNumber(e.amount);
      monthsSet.add(e.date.substring(0, 7));
    }

    const monthCount = Math.max(monthsSet.size, 1);

    const revenueTransactions = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );
    const grossRevenue = revenueTransactions.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );

    const commissionPaid = transactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const totalMonthlyCosts = (commissionPaid + opexTotal) / monthCount;
    const monthlyFixedCosts = opexTotal / monthCount;

    const activeBusinessIds = new Set(
      transactions
        .filter((t) => t.businessId && t.type === FosTransactionType.SUBSCRIPTION)
        .map((t) => t.businessId),
    );
    const activeBusinesses = activeBusinessIds.size || 1;

    const arpu =
      activeBusinesses > 0
        ? grossRevenue / activeBusinesses / monthCount
        : 0;

    const breakEvenBusinesses =
      arpu > 0 ? Math.ceil(totalMonthlyCosts / arpu) : 0;

    const breakEvenRevenue = totalMonthlyCosts;
    const progressPercent =
      totalMonthlyCosts > 0
        ? Math.min(100, Math.round((grossRevenue / totalMonthlyCosts) * 100 * 100) / 100)
        : 100;

    const remainingGap = Math.max(0, totalMonthlyCosts - grossRevenue);
    const isProfitable = grossRevenue >= totalMonthlyCosts;

    return {
      success: true,
      data: {
        totalMonthlyCosts: Math.round(totalMonthlyCosts * 100) / 100,
        monthlyFixedCosts: Math.round(monthlyFixedCosts * 100) / 100,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        activeBusinesses,
        arpu: Math.round(arpu * 100) / 100,
        breakEvenBusinesses,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        progressPercent,
        remainingGap: Math.round(remainingGap * 100) / 100,
        isProfitable,
      },
    };
  }
}
