import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForecastProjectionRequestDto {
  @ApiProperty({ example: 340 })
  @IsNumber()
  @Min(0)
  baseBusinesses: number;

  @ApiProperty({ example: 3676.47 })
  @IsNumber()
  @Min(0)
  arpu: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  fixedCosts: number;

  @ApiProperty({ example: 1250000 })
  @IsNumber()
  @Min(0)
  grossRevenue: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Max(100)
  variableCostMargin: number;

  @ApiProperty({ example: 2500000 })
  @IsNumber()
  @Min(0)
  cashBalance: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  qrThriveLeadsPerMonth: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  @Max(36)
  period: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(50)
  growthRate: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(30)
  churnRate: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number;
}

class MonthlyDataDto {
  @ApiProperty({ example: 'Month 1' })
  month: string;

  @ApiProperty({ example: 340 })
  businesses: number;

  @ApiProperty({ example: 1250000 })
  mrr: number;

  @ApiProperty({ example: 500000 })
  profit: number;

  @ApiProperty({ example: 1250000 })
  inflow: number;

  @ApiProperty({ example: 750000 })
  outflow: number;

  @ApiProperty({ example: 2100000 })
  cashBalance: number;
}

class SummaryDto {
  @ApiProperty({ example: 1800000 })
  projectedMrr: number;

  @ApiProperty({ example: 44.0 })
  mrrGrowthPercent: number;

  @ApiProperty({ example: 7200000 })
  totalProjectedProfit: number;

  @ApiProperty({ example: false })
  isDeclining: boolean;

  @ApiProperty({ example: 'HEALTHY' })
  healthAlert: 'HIGH_RISK' | 'HEALTHY';
}

export class ForecastProjectionResponseDto {
  @ApiProperty({ type: SummaryDto })
  summary: SummaryDto;

  @ApiProperty({ type: [MonthlyDataDto] })
  monthlyData: MonthlyDataDto[];
}

export class SaveForecastRequestDto {
  @ApiProperty({ example: 'Q1 2026 Projection' })
  @IsString()
  @IsNotEmpty()
  scenarioName: string;

  @ApiProperty()
  @IsNotEmpty()
  parameters: {
    growthRate: number;
    churnRate: number;
    conversionRate: number;
    period: number;
  };

  @ApiProperty()
  @IsNotEmpty()
  result: ForecastProjectionResponseDto;
}

export class SavedForecastDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  scenarioName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  parameters: {
    growthRate: number;
    churnRate: number;
    conversionRate: number;
    period: number;
  };

  @ApiProperty()
  summary: {
    projectedMrr: number;
    mrrGrowthPercent: number;
    totalProjectedProfit: number;
    isDeclining: boolean;
    healthAlert: 'HIGH_RISK' | 'HEALTHY';
  };
}

export class SavedForecastListDto {
  @ApiProperty({ type: [SavedForecastDto] })
  data: SavedForecastDto[];
}
