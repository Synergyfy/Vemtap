import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CampaignType {
  WHATSAPP = 'WhatsApp',
  SMS = 'SMS',
  EMAIL = 'Email',
}

export enum CampaignStatus {
  ACTIVE = 'Active',
  SCHEDULED = 'Scheduled',
  RECURRING = 'Recurring',
  DRAFT = 'Draft',
  COMPLETED = 'Completed',
}

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Weekend Coffee Special',
    description: 'Name of the campaign',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CampaignType, example: 'WhatsApp' })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({ example: 'all', description: 'Target audience filter' })
  @IsString()
  @IsNotEmpty()
  audience: string;

  @ApiProperty({
    example: 'Hello {name}, visit us today!',
    description: 'Message content',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '2024-10-12T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiProperty({ enum: CampaignStatus, example: 'Scheduled', required: false })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus = CampaignStatus.DRAFT;
}
