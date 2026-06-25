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
  @ApiProperty()
  totalVisitors: number;

  @ApiProperty()
  newVisitors: number;

  @ApiProperty()
  repeatVisitors: number;

  @ApiProperty()
  todaysVisits: number;
}

export class BusinessDashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

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
