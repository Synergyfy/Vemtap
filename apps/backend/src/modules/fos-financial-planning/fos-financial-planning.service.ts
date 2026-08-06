import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import {
  FinancialTarget,
  TargetPeriodType,
} from './entities/financial-target.entity';
import {
  CreateTargetDto,
  TargetFilterDto,
  TargetResponseDto,
  ScenarioSimulationRequestDto,
  ScenarioSimulationResponseDto,
} from './dto/financial-planning.dto';

@Injectable()
export class FosFinancialPlanningService {
  private readonly logger = new Logger(FosFinancialPlanningService.name);

  constructor(
    @InjectRepository(FinancialTarget)
    private readonly targetRepo: Repository<FinancialTarget>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
  ) {}

  async createTarget(dto: CreateTargetDto): Promise<TargetResponseDto> {
    const target = this.targetRepo.create({
      periodType: dto.periodType,
      targetRevenue: dto.targetRevenue,
      targetBusinesses: dto.targetBusinesses,
      targetSmsUsage: dto.targetSmsUsage,
      targetEmailUsage: dto.targetEmailUsage,
      profitMargin: dto.profitMargin,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    const saved = await this.targetRepo.save(target);
    return this.buildTargetResponse(saved);
  }

  async getTargets(filter: TargetFilterDto): Promise<TargetResponseDto[]> {
    const where: FindOptionsWhere<FinancialTarget> = {};
    if (filter.periodType) {
      where.periodType = filter.periodType;
    }
    const targets = await this.targetRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return Promise.all(targets.map((t) => this.buildTargetResponse(t)));
  }

  private async buildTargetResponse(
    target: FinancialTarget,
  ): Promise<TargetResponseDto> {
    const transactions = await this.transactionRepo.find({
      where: {
        type: FosTransactionType.SUBSCRIPTION,
      },
    });

    const actualRevenue = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const actualProfit = transactions.reduce(
      (sum, t) => sum + Number(t.profit),
      0,
    );

    const targetRevenue = Number(target.targetRevenue);
    const targetProfit = targetRevenue * (Number(target.profitMargin) / 100);

    const achievedRevenuePercentage =
      targetRevenue > 0
        ? Math.round((actualRevenue / targetRevenue) * 10000) / 100
        : 0;
    const achievedProfitPercentage =
      targetProfit > 0
        ? Math.round((actualProfit / targetProfit) * 10000) / 100
        : 0;

    return {
      id: target.id,
      periodType: target.periodType,
      targetRevenue: Number(target.targetRevenue),
      targetBusinesses: target.targetBusinesses,
      targetSmsUsage: target.targetSmsUsage,
      targetEmailUsage: target.targetEmailUsage,
      profitMargin: Number(target.profitMargin),
      achievedRevenuePercentage,
      achievedProfitPercentage,
      startDate: target.startDate,
      endDate: target.endDate,
      createdAt: target.createdAt,
    };
  }

  async simulateScenario(
    dto: ScenarioSimulationRequestDto,
  ): Promise<ScenarioSimulationResponseDto> {
    const runProjection = (
      businesses: number,
      growthRate: number,
      churnRate: number,
      pricing: number,
      agentFactor: number,
      months: number,
      margin: number,
    ) => {
      let currentBiz = businesses;
      let totalProfit = 0;
      const monthlyBreakdown: {
        month: number;
        businesses: number;
        profit: number;
      }[] = [];

      for (let i = 1; i <= months; i++) {
        currentBiz =
          currentBiz *
          (1 + (growthRate / 100) * agentFactor) *
          (1 - churnRate / 100);
        const monthRevenue = currentBiz * pricing;
        const monthProfit = monthRevenue * (margin / 100);
        totalProfit += monthProfit;

        monthlyBreakdown.push({
          month: i,
          businesses: Math.round(currentBiz),
          profit: Math.round(monthProfit * 100) / 100,
        });
      }

      return {
        totalProfit: Math.round(totalProfit * 100) / 100,
        monthlyBreakdown,
      };
    };

    const best = runProjection(
      dto.currentBusinesses,
      dto.growthRate * 1.5,
      dto.churnRate * 0.8,
      dto.pricing,
      dto.agentFactor * 1.2,
      dto.projectionMonths,
      dto.profitMargin,
    );

    const expected = runProjection(
      dto.currentBusinesses,
      dto.growthRate,
      dto.churnRate,
      dto.pricing,
      dto.agentFactor,
      dto.projectionMonths,
      dto.profitMargin,
    );

    const worst = runProjection(
      dto.currentBusinesses,
      dto.growthRate * 0.3,
      dto.churnRate + 5,
      dto.pricing * 0.7,
      dto.agentFactor * 0.7,
      dto.projectionMonths,
      dto.profitMargin,
    );

    return { best, expected, worst };
  }
}
