import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForecastScenario } from './entities/forecast-scenario.entity';
import {
  ForecastProjectionRequestDto,
  ForecastProjectionResponseDto,
  SaveForecastRequestDto,
  SavedForecastDto,
} from './dto/forecasting.dto';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { CashFlow, CashFlowType } from '../fos-core/entities/cash-flow.entity';
import { Expense } from '../fos-core/entities/expense.entity';

@Injectable()
export class FosForecastingService {
  private readonly logger = new Logger(FosForecastingService.name);

  constructor(
    @InjectRepository(ForecastScenario)
    private readonly scenarioRepo: Repository<ForecastScenario>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepo: Repository<CashFlow>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  async getDefaults() {
    const [transactions, cashflows, expenses] = await Promise.all([
      this.transactionRepo.find(),
      this.cashFlowRepo.find(),
      this.expenseRepo.find(),
    ]);

    const revenueTransactions = transactions.filter(
      (t) =>
        t.type === FosTransactionType.SUBSCRIPTION ||
        t.type === FosTransactionType.SMS,
    );

    const grossRevenue = revenueTransactions.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );

    const activeBusinessIds = new Set(
      transactions
        .filter(
          (t) => t.businessId && t.type === FosTransactionType.SUBSCRIPTION,
        )
        .map((t) => t.businessId),
    );
    const baseBusinesses = activeBusinessIds.size || 0;
    const arpu =
      baseBusinesses > 0 ? Math.round(grossRevenue / baseBusinesses) : 0;

    const totalInflow = cashflows
      .filter((cf) => cf.type === CashFlowType.INFLOW)
      .reduce((sum, cf) => sum + this.toNumber(cf.amount), 0);
    const totalOutflow = cashflows
      .filter((cf) => cf.type === CashFlowType.OUTFLOW)
      .reduce((sum, cf) => sum + this.toNumber(cf.amount), 0);
    const cashBalance = totalInflow - totalOutflow;

    const fixedCosts = expenses.reduce(
      (sum, e) => sum + this.toNumber(e.amount),
      0,
    );

    const qrTransactions = transactions.filter(
      (t) => t.type === FosTransactionType.SMS,
    );
    const qrThriveLeadsPerMonth =
      qrTransactions.length > 0 ? Math.round(qrTransactions.length / 3) : 0;

    return {
      baseBusinesses,
      arpu,
      fixedCosts: Math.round(fixedCosts * 100) / 100,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      variableCostMargin: 50,
      cashBalance: Math.round(cashBalance * 100) / 100,
      qrThriveLeadsPerMonth,
      growthRate: 10,
      churnRate: 5,
      conversionRate: 15,
    };
  }

  async project(
    dto: ForecastProjectionRequestDto,
  ): Promise<ForecastProjectionResponseDto> {
    let currentBiz = dto.baseBusinesses;
    let currentCash = dto.cashBalance;
    let totalProfit = 0;
    const monthlyData: ForecastProjectionResponseDto['monthlyData'] = [];

    const margin =
      dto.variableCostMargin > 1
        ? dto.variableCostMargin / 100
        : dto.variableCostMargin;
    const start = new Date();
    start.setDate(1);

    for (let i = 1; i <= dto.period; i++) {
      const newConversions =
        dto.qrThriveLeadsPerMonth * (dto.conversionRate / 100);
      const organicNew = Math.round(currentBiz * (dto.growthRate / 100));
      const churned = Math.round(currentBiz * (dto.churnRate / 100));

      currentBiz = currentBiz + organicNew + newConversions - churned;
      if (currentBiz < 0) currentBiz = 0;

      const mrr = currentBiz * dto.arpu;
      const profit = mrr * margin - dto.fixedCosts;
      const inflow = mrr;
      const outflow = mrr * (1 - margin) + dto.fixedCosts;

      currentCash += profit;
      totalProfit += profit;

      const periodStart = new Date(start);
      periodStart.setMonth(start.getMonth() + (i - 1));
      const month = periodStart.toISOString().substring(0, 7);

      monthlyData.push({
        month,
        businesses: Math.round(currentBiz),
        mrr: Math.round(mrr * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        cashBalance: Math.round(currentCash * 100) / 100,
      });
    }

    const firstMrr = monthlyData[0]?.mrr || 0;
    const lastMrr = monthlyData[monthlyData.length - 1]?.mrr || 0;
    const mrrGrowthPercent =
      firstMrr > 0 ? ((lastMrr - firstMrr) / firstMrr) * 100 : 0;

    const finalCash =
      monthlyData[monthlyData.length - 1]?.cashBalance || currentCash;
    const isDeclining = finalCash < dto.cashBalance;
    const healthAlert: 'HIGH_RISK' | 'HEALTHY' =
      isDeclining || mrrGrowthPercent < 0 ? 'HIGH_RISK' : 'HEALTHY';

    return {
      summary: {
        projectedMrr: Math.round(lastMrr * 100) / 100,
        mrrGrowthPercent: Math.round(mrrGrowthPercent * 100) / 100,
        totalProjectedProfit: Math.round(totalProfit * 100) / 100,
        isDeclining,
        healthAlert,
      },
      monthlyData,
    };
  }

  async persist(dto: SaveForecastRequestDto): Promise<SavedForecastDto> {
    const scenario = this.scenarioRepo.create({
      scenarioName: dto.scenarioName,
      parameters: dto.parameters,
      result: dto.result as unknown as Record<string, unknown>,
    });
    const saved = await this.scenarioRepo.save(scenario);
    return {
      id: saved.id,
      scenarioName: saved.scenarioName,
      createdAt: saved.createdAt,
      parameters: saved.parameters,
      summary: saved.result.summary as SavedForecastDto['summary'],
    };
  }

  async getHistory(): Promise<SavedForecastDto[]> {
    const scenarios = await this.scenarioRepo.find({
      order: { createdAt: 'DESC' },
    });
    return scenarios.map((s) => ({
      id: s.id,
      scenarioName: s.scenarioName,
      createdAt: s.createdAt,
      parameters: s.parameters,
      summary: (s.result as any).summary as SavedForecastDto['summary'],
    }));
  }
}
