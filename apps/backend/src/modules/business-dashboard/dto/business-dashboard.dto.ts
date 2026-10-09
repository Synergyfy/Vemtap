import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardVisitorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  time?: string;

  @ApiPropertyOptional()
  timestamp?: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  branchId?: string;

  @ApiPropertyOptional()
  location?: string;
}

export class DashboardActivityPointDto {
  @ApiProperty()
  hour: string;

  @ApiProperty()
  visits: number;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardRewardDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  points: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  active: boolean;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardNotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  read: boolean;

  @ApiProperty()
  type: string;

  @ApiProperty()
  scope: string;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  audience?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  delivered: string;

  @ApiProperty()
  deliveryRate: number;

  @ApiProperty()
  clicks: number;

  @ApiPropertyOptional()
  opens?: number;

  @ApiProperty()
  ctr: number;

  @ApiProperty()
  timestamp: number;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardStaffDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  lastActive: string;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardDeviceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  location: string;

  @ApiPropertyOptional()
  assignedTo?: string;

  @ApiProperty()
  lastActive: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  batteryLevel: number;

  @ApiProperty()
  totalScans: number;

  @ApiPropertyOptional()
  branchId?: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Lifetime visitors for the business/branch' })
  totalVisitors: number;

  @ApiProperty({ description: 'First-time visitors (status "new")' })
  newVisitors: number;

  @ApiProperty({ description: 'Returning visitors (status "returning")' })
  repeatVisitors: number;

  @ApiProperty({ description: 'Visits recorded today' })
  todaysVisits: number;

  @ApiProperty({
    description:
      'Lifetime offer views (sum of offer.view counters; no delta because views are not event-tracked)',
  })
  totalViews: number;

  @ApiProperty({
    description: 'Lifetime deal claims (claimed + redeemed)',
  })
  totalClaims: number;

  @ApiProperty({
    nullable: true,
    description:
      'Visitors change %, last 7 days vs the previous 7 days (null when the previous window was empty)',
    example: 14,
  })
  visitorsDelta: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Claims change %, last 7 days vs the previous 7 days',
    example: 8,
  })
  claimsDelta: number | null;

  @ApiProperty({
    nullable: true,
    description:
      'Completed POS revenue change %, last 7 days vs the previous 7 days',
    example: 22,
  })
  revenueDelta: number | null;
}

export class DashboardWeeklyDto {
  @ApiProperty({ description: 'Visits in the last 7 days', example: 42 })
  visits: number;

  @ApiProperty({ description: 'Deal claims in the last 7 days', example: 7 })
  claims: number;

  @ApiProperty({
    description: 'Completed POS revenue in the last 7 days (naira)',
    example: 125000,
  })
  revenue: number;
}

export class DashboardInsightDto {
  @ApiProperty({ example: 'convert-visitors' })
  id: string;

  @ApiProperty({ example: 'Turn visitors into claims' })
  title: string;

  @ApiProperty({
    example: 'Publish a promotion so visitors can claim a pass.',
  })
  message: string;

  @ApiProperty({ enum: ['high', 'medium', 'low'], example: 'high' })
  priority: 'high' | 'medium' | 'low';
}

export class BusinessDashboardResponseDto {
  @ApiProperty({
    description: 'When this payload was generated (ISO)',
    example: '2026-10-08T21:00:00.000Z',
  })
  generatedAt: string;

  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: DashboardWeeklyDto })
  weekly: DashboardWeeklyDto;

  @ApiProperty({ type: [DashboardInsightDto] })
  insights: DashboardInsightDto[];

  @ApiProperty({ type: [DashboardVisitorDto] })
  recentVisitors: DashboardVisitorDto[];

  @ApiProperty({ type: [DashboardActivityPointDto] })
  activityData: DashboardActivityPointDto[];

  @ApiProperty({ type: [DashboardRewardDto] })
  rewards: DashboardRewardDto[];

  @ApiProperty({ type: [DashboardNotificationDto] })
  notifications: DashboardNotificationDto[];

  @ApiProperty({ type: [DashboardMessageDto] })
  messages: DashboardMessageDto[];

  @ApiProperty({ type: [DashboardStaffDto] })
  staffMembers: DashboardStaffDto[];

  @ApiProperty({ type: [DashboardDeviceDto] })
  devices: DashboardDeviceDto[];

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  businessLogo: string;
}
