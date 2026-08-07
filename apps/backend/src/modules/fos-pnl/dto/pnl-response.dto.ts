import { ApiProperty } from '@nestjs/swagger';

export class PnlStatementResponseDto {
  @ApiProperty({ example: 5000000 })
  grossRevenue: number;

  @ApiProperty({ example: 250000 })
  gatewayCost: number;

  @ApiProperty({ example: 750000 })
  commissionPaid: number;

  @ApiProperty({ example: 500000 })
  opexPaid: number;

  @ApiProperty({ example: 3500000 })
  netProfit: number;

  @ApiProperty({ example: 70.0 })
  profitMarginPercentage: number;

  @ApiProperty({
    example: [{ name: 'Subscription', value: 3500000 }],
  })
  revenueByCategory: { name: string; value: number }[];

  @ApiProperty({
    example: [
      { name: 'QRThrive', revenue: 1200000, profit: 900000, margin: 75.0 },
    ],
  })
  productProfitability: {
    name: string;
    revenue: number;
    profit: number;
    margin: number;
  }[];
}

export class RevenueTrendDto {
  @ApiProperty({ example: '2026-01' })
  month: string;

  @ApiProperty({ example: 450000 })
  revenue: number;

  @ApiProperty({ example: 400000 })
  costs: number;

  @ApiProperty({ example: 50000 })
  profit: number;
}

export class CashFlowRunwayResponseDto {
  @ApiProperty({ example: 2500000 })
  openingCashBalance: number;

  @ApiProperty({ example: 2100000 })
  closingCashBalance: number;

  @ApiProperty({ example: -400000 })
  monthlyNetCashFlow: number;

  @ApiProperty({ example: 400000 })
  monthlyBurnRate: number;

  @ApiProperty({ example: 5 })
  runwayMonths: number;

  @ApiProperty({ example: 1260000 })
  availableCash: number;

  @ApiProperty({ example: 525000 })
  committedCash: number;

  @ApiProperty({ example: 315000 })
  reservedCash: number;
}

export class CostBreakEvenResponseDto {
  @ApiProperty({ example: 1250000 })
  totalMonthlyCosts: number;

  @ApiProperty({ example: 500000 })
  monthlyFixedCosts: number;

  @ApiProperty({ example: 5000000 })
  grossRevenue: number;

  @ApiProperty({ example: 340 })
  activeBusinesses: number;

  @ApiProperty({ example: 3676 })
  arpu: number;

  @ApiProperty({ example: 340 })
  breakEvenBusinesses: number;

  @ApiProperty({ example: 1250000 })
  breakEvenRevenue: number;

  @ApiProperty({ example: 100 })
  progressPercent: number;

  @ApiProperty({ example: 0 })
  remainingGap: number;

  @ApiProperty({ example: true })
  isProfitable: boolean;
}

export class ExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  frequency: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  createdAt: Date;
}

export class CashFlowEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  date: string;

  @ApiProperty()
  createdAt: Date;
}
