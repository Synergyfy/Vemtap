import { ApiProperty } from '@nestjs/swagger';

export class ActivityFeedItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({
    example: 'registration',
    enum: ['registration', 'visit', 'order', 'message'],
  })
  type: 'registration' | 'visit' | 'order' | 'message';

  @ApiProperty({ example: 'Sarah J.' })
  userName: string;

  @ApiProperty({ example: 'Registered via Main Entrance QR' })
  description: string;

  @ApiProperty({ example: '2026-06-27T14:22:00Z' })
  timestamp: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  branchId?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

export class PaginatedActivityFeedResponseDto {
  @ApiProperty({ type: [ActivityFeedItemDto] })
  data: ActivityFeedItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
