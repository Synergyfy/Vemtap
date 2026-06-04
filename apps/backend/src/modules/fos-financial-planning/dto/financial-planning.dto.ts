import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TargetPeriodType } from '../entities/financial-target.entity';

export class CreateTargetDto {
  @ApiProperty({ enum: TargetPeriodType, example: TargetPeriodType.MONTHLY })
  @IsEnum(TargetPeriodType)
  @IsNotEmpty()
  periodType: TargetPeriodType;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  targetRevenue: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  targetBusinesses: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  targetSmsUsage: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  targetEmailUsage: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profitMargin: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class TargetFilterDto {
  @ApiPropertyOptional({ enum: TargetPeriodType })
  @IsOptional()
  @IsEnum(TargetPeriodType)
  periodType?: TargetPeriodType;
}

export class TargetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TargetPeriodType })
  periodType: TargetPeriodType;

  @ApiProperty({ example: 5000000 })
  targetRevenue: number;

  @ApiProperty({ example: 500 })
  targetBusinesses: number;

  @ApiProperty({ example: 10000 })
  targetSmsUsage: number;

  @ApiProperty({ example: 5000 })
  targetEmailUsage: number;

  @ApiProperty({ example: 30 })
  profitMargin: number;

  @ApiProperty({ example: 45.5 })
  achievedRevenuePercentage: number;

  @ApiProperty({ example: 38.2 })
  achievedProfitPercentage: number;

  @ApiProperty({ example: '2026-01-01' })
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  endDate: string;

  @ApiProperty()
  createdAt: Date;
}

export class ScenarioSimulationRequestDto {
  @ApiProperty({ example: 340 })
  @IsNumber()
  @Min(0)
  currentBusinesses: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  growthRate: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(20)
  churnRate: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  pricing: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0.5)
  @Max(5)
  agentFactor: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  @Max(24)
  projectionMonths: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profitMargin: number;
}

class MonthlyBreakdownDto {
  @ApiProperty()
  month: number;

  @ApiProperty()
  businesses: number;

  @ApiProperty()
  profit: number;
}

class ScenarioResultDto {
  @ApiProperty()
  totalProfit: number;

  @ApiProperty({ type: [MonthlyBreakdownDto] })
  monthlyBreakdown: MonthlyBreakdownDto[];
}

export class ScenarioSimulationResponseDto {
  @ApiProperty({ type: ScenarioResultDto })
  best: ScenarioResultDto;

  @ApiProperty({ type: ScenarioResultDto })
  expected: ScenarioResultDto;

  @ApiProperty({ type: ScenarioResultDto })
  worst: ScenarioResultDto;
}
