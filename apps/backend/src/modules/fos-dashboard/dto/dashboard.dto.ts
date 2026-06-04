import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { FosTransactionType } from '../../fos-core/entities/financial-transaction.entity';

export class DashboardStatsResponseDto {
  @ApiProperty({ example: 1250000 })
  totalRevenue: number;

  @ApiProperty({ example: 450000 })
  netProfit: number;

  @ApiProperty({ example: 340 })
  totalBusinesses: number;

  @ApiProperty({ example: 28 })
  activeAgents: number;

  @ApiProperty({ example: 15200 })
  smsSent: number;

  @ApiProperty({ example: 850000 })
  vemtapRevenue: number;

  @ApiProperty({ example: 400000 })
  qrthriveRevenue: number;

  @ApiProperty({ example: 175000 })
  commissionsPaid: number;

  @ApiProperty({ example: 2500000 })
  cashBalance: number;

  @ApiProperty({ example: 5.2 })
  churnRate: number;

  @ApiProperty({ example: 12.8 })
  conversionRate: number;
}

export class DashboardSnapshotDto {
  @ApiProperty({ example: '2026-01-15' })
  date: string;

  @ApiProperty({ example: 1250000 })
  totalRevenue: number;

  @ApiProperty({ example: 450000 })
  totalProfit: number;

  @ApiProperty({ example: 340 })
  totalBusinesses: number;

  @ApiProperty({ example: 5.2 })
  churnRate: number;

  @ApiProperty({ example: 12.8 })
  conversionRate: number;
}

export class DashboardSnapshotListDto {
  @ApiProperty({ type: [DashboardSnapshotDto] })
  data: DashboardSnapshotDto[];
}

export class DashboardInsightDto {
  @ApiProperty({ example: 'HIGH_PERFORMANCE' })
  type: string;

  @ApiProperty({ example: 'Best Performing Agent' })
  title: string;

  @ApiProperty({ example: 'Agent John generated NGN 250,000 in MRR this month' })
  message: string;

  @ApiProperty({ example: 'SUCCESS' })
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
}

export class DashboardInsightListDto {
  @ApiProperty({ type: [DashboardInsightDto] })
  insights: DashboardInsightDto[];
}

export class DashboardTransactionFilterDto {
  @ApiPropertyOptional({ enum: FosTransactionType })
  @IsOptional()
  @IsEnum(FosTransactionType)
  type?: FosTransactionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
