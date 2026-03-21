import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsStatDto {
  @ApiProperty({ example: 'Total Visits' })
  label: string;

  @ApiProperty({ example: '1,240' })
  value: string;

  @ApiProperty({ example: '+12%', required: false })
  trend?: string;

  @ApiProperty({ example: true, required: false })
  isUp?: boolean;

  @ApiProperty({ example: 0, required: false })
  change?: number;
}

export class PeakTimeDto {
  @ApiProperty({ example: '9am' })
  hour: string;

  @ApiProperty({ example: 30 })
  value: number;
}

export class MessagingRoiDto {
  @ApiProperty({ example: 'Sent' })
  label: string;

  @ApiProperty({ example: '12,450' })
  value: string;

  @ApiProperty({ example: '98%', required: false })
  sub?: string;
}

export class EngagementQualityDto {
  @ApiProperty({ example: '78%' })
  surveyCompletion: string;

  @ApiProperty({ example: '12.4%' })
  reviewConversion: string;

  @ApiProperty({ example: '42/day' })
  socialFollows: string;
}

export class TopPerformerDto {
  @ApiProperty({ example: 'Review Collection' })
  label: string;

  @ApiProperty({ example: 'collection' })
  type: string;
}

export class DashboardAnalyticsResponseDto {
  @ApiProperty({ type: [AnalyticsStatDto] })
  stats: AnalyticsStatDto[];

  @ApiProperty({ type: [PeakTimeDto] })
  peakTimes: PeakTimeDto[];

  @ApiProperty({ type: [MessagingRoiDto] })
  messagingRoi: MessagingRoiDto[];

  @ApiProperty({ type: EngagementQualityDto })
  engagementQuality: EngagementQualityDto;

  @ApiProperty({ type: [TopPerformerDto] })
  topPerformers: TopPerformerDto[];
}

export class HourlyDataDto {
  @ApiProperty({ example: '8am' })
  hour: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class TrafficByEntranceDto {
  @ApiProperty({ example: 'Main Gate' })
  name: string;

  @ApiProperty({ example: '45%' })
  percentage: string;

  @ApiProperty({ example: '2,842' })
  count: string;
}

export class VisitDurationDistributionDto {
  @ApiProperty({ example: 'Short' })
  label: string;

  @ApiProperty({ example: '< 15m' })
  time: string;

  @ApiProperty({ example: '24%' })
  p: string;
}

export class VisitDurationDto {
  @ApiProperty({ example: '45 Minutes' })
  averageStay: string;

  @ApiProperty({ example: '+12%' })
  trendText: string;

  @ApiProperty({ type: [VisitDurationDistributionDto] })
  distribution: VisitDurationDistributionDto[];
}

export class FootfallAnalyticsResponseDto {
  @ApiProperty({ type: [AnalyticsStatDto] })
  stats: AnalyticsStatDto[];

  @ApiProperty({ type: [HourlyDataDto] })
  hourlyData: HourlyDataDto[];

  @ApiProperty({ type: [TrafficByEntranceDto] })
  trafficByEntrance: TrafficByEntranceDto[];

  @ApiProperty({ type: VisitDurationDto })
  visitDuration: VisitDurationDto;
}

export class WeeklyDataDto {
  @ApiProperty({ example: 'Monday' })
  day: string;

  @ApiProperty({ example: [10, 15, 20, 25, 40, 50, 45, 30, 25, 20] })
  hours: number[];
}

export class SmartSuggestionDto {
  @ApiProperty({ example: 'Saturdays between 6pm - 8pm' })
  peakTime: string;

  @ApiProperty({
    example:
      'Based on your peak times (Saturdays between 6pm - 8pm), we suggest adding **2 additional staff** members during this window.',
  })
  recommendation: string;
}

export class PeakTimesAnalyticsResponseDto {
  @ApiProperty({ type: [WeeklyDataDto] })
  weeklyData: WeeklyDataDto[];

  @ApiProperty({
    example: ['10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am'],
  })
  hoursLabels: string[];

  @ApiProperty({ type: SmartSuggestionDto })
  smartSuggestion: SmartSuggestionDto;
}

export class MonthlyGrowthDto {
  @ApiProperty({ example: 'Jan' })
  month: string;

  @ApiProperty({ example: 120 })
  value: number;
}

export class SectorSplitDto {
  @ApiProperty({ example: 'Retail' })
  label: string;

  @ApiProperty({ example: 45 })
  value: number;
}

export class SecurityAlertDto {
  @ApiProperty({ example: 'Business X was suspended' })
  msg: string;

  @ApiProperty({ example: 'risk' })
  type: string;
}

export class AdminSummaryResponseDto {
  @ApiProperty({ type: [AnalyticsStatDto] })
  stats: AnalyticsStatDto[];

  @ApiProperty({ type: [MonthlyGrowthDto] })
  monthlyData: MonthlyGrowthDto[];

  @ApiProperty({ type: [SectorSplitDto] })
  sectorSplit: SectorSplitDto[];

  @ApiProperty({ type: [SecurityAlertDto] })
  securityAlerts: SecurityAlertDto[];
}

export class BusinessSummaryResponseDto {
  @ApiProperty({ example: 150 })
  totalActiveBusiness: number;

  @ApiProperty({ example: 25 })
  totalPendingBusiness: number;

  @ApiProperty({ example: 10 })
  totalSuspendedBusiness: number;

  @ApiProperty({ example: 5000 })
  totalPlatformUsers: number;
}

