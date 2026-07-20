import { ApiProperty } from '@nestjs/swagger';

export class AffiliateActivityDto {
  @ApiProperty({ description: 'Type of activity', example: 'referral', enum: ['referral', 'commission', 'withdrawal'] })
  type: string;

  @ApiProperty({ description: 'Short title of the activity', example: 'New Referral' })
  title: string;

  @ApiProperty({ description: 'Detailed description', example: 'Referral signed up' })
  desc: string;

  @ApiProperty({ description: 'Timestamp of the activity', example: '2026-07-20T10:00:00.000Z' })
  time: Date;
}
