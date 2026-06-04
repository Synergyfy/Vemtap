import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FosTransactionType,
  FosPlatform,
} from '../../fos-core/entities/financial-transaction.entity';

// ──────────────────────────────────────────────
// Query DTOs
// ──────────────────────────────────────────────

export class RevenueTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 10;

  @ApiPropertyOptional({ enum: FosTransactionType })
  @IsOptional()
  @IsEnum(FosTransactionType)
  type?: FosTransactionType;

  @ApiPropertyOptional({ enum: FosPlatform })
  @IsOptional()
  @IsEnum(FosPlatform)
  platform?: FosPlatform;

  @ApiPropertyOptional({ description: 'Filter by business UUID' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Filter by agent ID' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ChartDataQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: FosPlatform })
  @IsOptional()
  @IsEnum(FosPlatform)
  platform?: FosPlatform;

  @ApiPropertyOptional({ enum: FosTransactionType })
  @IsOptional()
  @IsEnum(FosTransactionType)
  type?: FosTransactionType;
}

export class BusinessIdParamDto {
  @ApiProperty({ description: 'Business UUID' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}

// ──────────────────────────────────────────────
// Response DTOs
// ──────────────────────────────────────────────

export class TransactionDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ enum: FosTransactionType })
  type: string;

  @ApiProperty({ enum: FosPlatform })
  platform: string;

  @ApiProperty({ example: 'card', nullable: true })
  paymentMethod: string | null;

  @ApiProperty({ example: 50000 })
  amount: number;

  @ApiProperty({ example: 0 })
  cost: number;

  @ApiProperty({ example: 50000 })
  profit: number;

  @ApiProperty({ example: 'pay_ref_123', nullable: true })
  referenceId: string | null;

  @ApiProperty({ example: '2026-01-15' })
  date: string;

  @ApiProperty({ nullable: true })
  businessId: string | null;

  @ApiProperty({ example: 'The Azure Bistro', nullable: true })
  businessName: string | null;

  @ApiProperty({ nullable: true })
  agentId: string | null;

  @ApiProperty({ example: 'John Agent', nullable: true })
  agentName: string | null;
}

export class TransactionsListResponseDto {
  @ApiProperty({ type: [TransactionDto] })
  transactions: TransactionDto[];

  @ApiProperty({ example: 42 })
  total: number;
}

export class RevenueAggregatesResponseDto {
  @ApiProperty({ example: 1250000 })
  totalRevenue: number;

  @ApiProperty({ example: 850000 })
  subscriptionRevenue: number;

  @ApiProperty({ example: 400000 })
  smsRevenue: number;

  @ApiProperty({ example: 450000 })
  totalProfit: number;

  @ApiProperty({ example: 175000 })
  agentPayouts: number;

  @ApiProperty({ example: 340 })
  totalTransactions: number;
}

export class RevenueTrendDto {
  @ApiProperty({ example: '2026-01-15' })
  date: string;

  @ApiProperty({ example: 1250000 })
  revenue: number;

  @ApiProperty({ example: 450000 })
  profit: number;
}

export class MonthlyPlatformRevenueDto {
  @ApiProperty({ example: 'Jan 26' })
  month: string;

  @ApiProperty({ example: 180000 })
  total: number;

  @ApiProperty({ example: 120000 })
  vemtap: number;

  @ApiProperty({ example: 60000 })
  qrthrive: number;
}

export class RevenueByTypeDto {
  @ApiProperty({ example: 'SUBSCRIPTION' })
  name: string;

  @ApiProperty({ example: 850000 })
  value: number;
}

export class RevenueChartDataResponseDto {
  @ApiProperty({ type: [MonthlyPlatformRevenueDto] })
  monthlyPlatformRevenue: MonthlyPlatformRevenueDto[];

  @ApiProperty({ type: [RevenueByTypeDto] })
  revenueByType: RevenueByTypeDto[];
}

export class BusinessTransactionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2026-01-15' })
  date: string;

  @ApiProperty({ example: 50000 })
  amount: number;

  @ApiProperty({ example: 50000 })
  profit: number;

  @ApiProperty({ enum: FosTransactionType })
  type: string;
}

export class BusinessRevenueHistoryResponseDto {
  @ApiProperty({ type: [BusinessTransactionItemDto] })
  transactions: BusinessTransactionItemDto[];
}

export class BusinessStatsResponseDto {
  @ApiProperty({ example: 45 })
  activeBusinesses: number;

  @ApiProperty({ example: 2250000 })
  totalMrr: number;

  @ApiProperty({ example: 10.0 })
  churnRate: number;

  @ApiProperty({ example: 5 })
  churnedCount: number;

  @ApiProperty({ example: 50 })
  totalBusinesses: number;

  @ApiProperty({
    example: { plan: 'GOLD', totalMrr: 1200000, businessCount: 24 },
    nullable: true,
  })
  bestSellingPlan: {
    plan: string;
    totalMrr: number;
    businessCount: number;
  } | null;

  @ApiProperty({
    example: [
      { plan: 'GOLD', count: 24, totalMrr: 1200000 },
      { plan: 'SILVER', count: 16, totalMrr: 800000 },
    ],
  })
  planDistribution: {
    plan: string;
    count: number;
    totalMrr: number;
  }[];

  @ApiProperty({
    example: [
      { status: 'active', count: 45 },
      { status: 'pending', count: 3 },
      { status: 'suspended', count: 5 },
    ],
  })
  statusDistribution: {
    status: string;
    count: number;
  }[];
}
