import { ApiProperty } from '@nestjs/swagger';

export class BreakEvenResponseDto {
  @ApiProperty({ example: 340 })
  activeBusinesses: number;

  @ApiProperty({ example: 3676.47 })
  arpu: number;

  @ApiProperty({ example: 200 })
  breakEvenBusinesses: number;

  @ApiProperty({ example: 735294 })
  breakEvenRevenue: number;

  @ApiProperty({ example: 58.82 })
  progressPercent: number;

  @ApiProperty({ example: 514706 })
  remainingGap: number;

  @ApiProperty({ example: false })
  isProfitable: boolean;

  @ApiProperty({ example: 500000 })
  totalMonthlyCosts: number;

  @ApiProperty({ example: 250000 })
  monthlyFixedCosts: number;

  @ApiProperty({ example: 1250000 })
  grossRevenue: number;
}

export class RunwayResponseDto {
  @ApiProperty({ example: 2500000 })
  openingCashBalance: number;

  @ApiProperty({ example: 2100000 })
  closingCashBalance: number;

  @ApiProperty({ example: -400000 })
  monthlyNetCashFlow: number;

  @ApiProperty({ example: 400000 })
  monthlyBurnRate: number;

  @ApiProperty({ example: 5.25 })
  runwayMonths: number;
}
