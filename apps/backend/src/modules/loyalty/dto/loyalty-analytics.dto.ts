import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TierThresholdDto {
  @ApiProperty({ example: 'Gold' })
  name: string;

  @ApiProperty({ example: 2000 })
  minPoints: number;
}

export class LoyaltyTierDto {
  @ApiProperty({ example: 1450, description: 'Global points balance' })
  points: number;

  @ApiProperty({ example: 'Silver' })
  tier: string;

  @ApiProperty({ example: 'Gold', nullable: true })
  nextTier: string | null;

  @ApiProperty({ example: 550, description: 'Points needed for the next tier' })
  pointsToNext: number;

  @ApiProperty({
    example: 45,
    description: 'Progress within the current tier (0–100)',
  })
  progressPercent: number;

  @ApiProperty({ type: [TierThresholdDto] })
  thresholds: TierThresholdDto[];
}

export class SavingsGrowthMetricDto {
  @ApiProperty({ example: 12000 })
  current: number;

  @ApiProperty({ example: 9800 })
  previous: number;

  @ApiProperty({
    example: 22,
    nullable: true,
    description: 'Percent change; null when the previous window had none',
  })
  percent: number | null;
}

export class SavingsGrowthDto {
  @ApiProperty({ example: 30 })
  periodDays: number;

  @ApiProperty({ type: SavingsGrowthMetricDto })
  netSavings: SavingsGrowthMetricDto;

  @ApiProperty({ type: SavingsGrowthMetricDto })
  dealsRedeemed: SavingsGrowthMetricDto;
}

export class VisitTrendPointDto {
  @ApiProperty({ example: 'Oct' })
  month: string;

  @ApiProperty({ example: 4 })
  visits: number;
}

export class VenuePointsDto {
  @ApiProperty({ example: 'Patrick Ventures' })
  venueName: string;

  @ApiProperty({ example: 120 })
  points: number;
}

export class AnalyticsTrendsDto {
  @ApiProperty({
    example: '+25%',
    description: 'Signed absolute or percent delta',
  })
  totalVisits: string;

  @ApiProperty({ example: '+10%' })
  rewardPoints: string;

  @ApiProperty({ example: '+18%' })
  netSavings: string;
}

export class CustomerAnalyticsDto {
  @ApiProperty({ example: 12 })
  totalVisits: number;

  @ApiProperty({ example: 1450 })
  currentPointsBalance: number;

  @ApiProperty({
    example: 8500,
    description:
      'Real naira saved across redeemed catalogue claims (original item sum minus deal price), lifetime',
  })
  netSavings: number;

  @ApiProperty({
    example: 150,
    description:
      'Previous points-based savings proxy retained for compatibility',
  })
  redeemedPoints: number;

  @ApiProperty({ example: 1 })
  dealsRedeemed: number;

  @ApiProperty({ example: 15 })
  avgDiscountPercent: number;

  @ApiProperty({
    type: SavingsGrowthDto,
    nullable: true,
    description: 'Null when allTime=true',
  })
  growthVsPreviousPeriod: SavingsGrowthDto | null;

  @ApiProperty({ example: false })
  allTime: boolean;

  @ApiProperty({ type: [VisitTrendPointDto] })
  visitTrends: VisitTrendPointDto[];

  @ApiProperty({ type: [VenuePointsDto] })
  pointsByVenue: VenuePointsDto[];

  @ApiProperty({ type: [VenuePointsDto] })
  topVenues: VenuePointsDto[];

  @ApiProperty({ type: AnalyticsTrendsDto })
  trends: AnalyticsTrendsDto;
}
