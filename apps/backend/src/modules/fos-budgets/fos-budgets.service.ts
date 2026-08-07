import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { ForecastScenario } from '../fos-forecasting/entities/forecast-scenario.entity';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto } from './dto/budget.dto';

@Injectable()
export class FosBudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  async create(dto: CreateBudgetDto, userId?: string) {
    const budget = this.budgetRepo.create({
      periodType: dto.periodType,
      targetRevenue: dto.targetRevenue,
      targetBusinesses: dto.targetBusinesses,
      targetSmsUsage: dto.targetSmsUsage,
      targetProfit: dto.targetProfit,
      startDate: dto.startDate,
      endDate: dto.endDate,
      createdBy: userId || null,
    });
    const saved = await this.budgetRepo.save(budget);
    return this.buildBudgetResponse(saved);
  }

  async findAll() {
    const budgets = await this.budgetRepo.find({
      order: { createdAt: 'DESC' },
    });
    return Promise.all(budgets.map((b) => this.buildBudgetResponse(b)));
  }

  async getForecasts() {
    const scenarioRepo = this.dataSource.getRepository(ForecastScenario);
    const qb = scenarioRepo
      .createQueryBuilder('fc')
      .orderBy('fc.createdAt', 'DESC');
    const rows = await qb.getMany();

    return rows.map((fc) => {
      const params = (fc.parameters || {}) as Record<string, unknown>;
      const result = fc.result || {};
      const summary = (result.summary || {}) as Record<string, unknown>;
      const period =
        typeof params.period === 'number' || typeof params.period === 'string'
          ? String(params.period)
          : '';
      return {
        id: fc.id,
        forecastType:
          summary.healthAlert === 'HIGH_RISK' ? 'PROFIT' : 'REVENUE',
        projectedValue: this.toNumber(summary.projectedMrr as number),
        growthRate: this.toNumber(params.growthRate as number),
        churnRate: this.toNumber(params.churnRate as number),
        conversionRate: this.toNumber(params.conversionRate as number),
        period,
        scenario: (params.scenario as string) || 'EXPECTED',
        createdAt: fc.createdAt,
      };
    });
  }

  private async buildBudgetResponse(budget: Budget) {
    const transactions = await this.transactionRepo.find({
      where: [
        { type: FosTransactionType.SUBSCRIPTION },
        { type: FosTransactionType.SMS },
      ],
    });

    const actualRevenue = transactions.reduce(
      (sum, t) => sum + this.toNumber(t.amount),
      0,
    );
    const actualProfit = transactions.reduce(
      (sum, t) => sum + this.toNumber(t.profit),
      0,
    );

    const targetRevenue = this.toNumber(budget.targetRevenue);
    const targetProfit = this.toNumber(budget.targetProfit);

    const achievedRevenuePercentage =
      targetRevenue > 0
        ? Math.round((actualRevenue / targetRevenue) * 10000) / 100
        : 0;
    const achievedProfitPercentage =
      targetProfit > 0
        ? Math.round((actualProfit / targetProfit) * 10000) / 100
        : 0;

    return {
      id: budget.id,
      periodType: budget.periodType,
      targetRevenue,
      targetBusinesses: budget.targetBusinesses,
      targetSmsUsage: budget.targetSmsUsage,
      targetProfit,
      startDate: budget.startDate,
      endDate: budget.endDate,
      achievedRevenuePercentage,
      achievedProfitPercentage,
      createdAt: budget.createdAt,
    };
  }
}
