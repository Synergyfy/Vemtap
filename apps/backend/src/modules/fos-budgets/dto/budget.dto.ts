import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriodType } from '../entities/budget.entity';

export class CreateBudgetDto {
  @ApiProperty({ enum: BudgetPeriodType, example: BudgetPeriodType.MONTHLY })
  @IsEnum(BudgetPeriodType)
  @IsNotEmpty()
  periodType: BudgetPeriodType;

  @ApiProperty({ example: 3000000 })
  @IsNumber()
  @Min(0)
  targetRevenue: number;

  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  targetBusinesses: number;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(0)
  targetSmsUsage: number;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(0)
  targetProfit: number;

  @ApiProperty({ example: '2026-06-18' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-07-18' })
  @IsDateString()
  endDate: string;
}

export class ForecastsQueryDto {
  @ApiPropertyOptional({ example: 'EXPECTED' })
  @IsOptional()
  @IsString()
  scenario?: string;
}
