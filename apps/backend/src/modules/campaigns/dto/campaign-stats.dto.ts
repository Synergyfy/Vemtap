import { ApiProperty } from '@nestjs/swagger';
import { CampaignStatus, CampaignType } from './create-campaign.dto';

export class CampaignStatsDto {
  @ApiProperty({ example: 'b3f1c2d4-5e6f-4a1b-9c8d-7e6f5a4b3c2d' })
  campaignId: string;

  @ApiProperty({ enum: CampaignStatus, example: 'Completed' })
  status: CampaignStatus;

  @ApiProperty({ example: 120, description: 'Messages queued at send time' })
  recipients: number;

  @ApiProperty({ example: 0, description: 'Still waiting in the queue' })
  queued: number;

  @ApiProperty({ example: 118, description: 'Handed to the provider' })
  sent: number;

  @ApiProperty({
    example: 112,
    description:
      'Delivered or read; for email, accepted by the provider (no receipts)',
  })
  delivered: number;

  @ApiProperty({ example: 40 })
  read: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ example: 23, description: 'Clicks on the tracked link' })
  clicks: number;

  @ApiProperty({ example: 93, description: 'delivered ÷ attempted, percent' })
  deliveredRate: number;

  @ApiProperty({ example: 20.5, description: 'clicks ÷ delivered, percent' })
  clickRate: number;
}

export class CampaignTestResultDto {
  @ApiProperty({ example: 'owner@urbangrill.ng' })
  to: string;

  @ApiProperty({ enum: CampaignType, example: 'Email' })
  channel: CampaignType;

  @ApiProperty({ example: 'sent', enum: ['queued', 'sent', 'failed'] })
  status: string;
}
