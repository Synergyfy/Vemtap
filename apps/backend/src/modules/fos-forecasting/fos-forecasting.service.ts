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

@Injectable()
export class FosForecastingService {
  private readonly logger = new Logger(FosForecastingService.name);

  constructor(
    @InjectRepository(ForecastScenario)
    private readonly scenarioRepo: Repository<ForecastScenario>,
  ) {}

  async project(
    dto: ForecastProjectionRequestDto,
  ): Promise<ForecastProjectionResponseDto> {
    let currentBiz = dto.baseBusinesses;
    let currentCash = dto.cashBalance;
    let totalProfit = 0;
    const monthlyData: ForecastProjectionResponseDto['monthlyData'] = [];

    for (let i = 1; i <= dto.period; i++) {
      const newConversions =
        dto.qrThriveLeadsPerMonth * (dto.conversionRate / 100);
      const organicNew = Math.round(currentBiz * (dto.growthRate / 100));
      const churned = Math.round(currentBiz * (dto.churnRate / 100));

      currentBiz = currentBiz + organicNew + newConversions - churned;
      if (currentBiz < 0) currentBiz = 0;

      const mrr = currentBiz * dto.arpu;
      const profit = mrr * dto.variableCostMargin - dto.fixedCosts;
      const inflow = mrr;
      const outflow = mrr * (1 - dto.variableCostMargin) + dto.fixedCosts;

      currentCash += profit;
      totalProfit += profit;

      monthlyData.push({
        month: `Month ${i}`,
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
