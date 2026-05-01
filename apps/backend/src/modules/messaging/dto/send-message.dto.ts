import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Channel } from '../enums/channel.enum';
import { AudienceType } from '../entities/message-campaign.entity';

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'Business ID (resolved from token if not provided)',
  })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({
    description:
      'Branch ID (required for campaign creation; derived from business if not provided)',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ enum: Channel })
  @IsEnum(Channel)
  channel: Channel;

  @ApiPropertyOptional({ enum: AudienceType })
  @IsOptional()
  @IsEnum(AudienceType)
  audienceType?: AudienceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Filter audience by segment (if AudienceType=SEGMENT)',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Sender ID or phone number',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Specific customer IDs for DIRECT send or GROUP send',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  customerIds?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
