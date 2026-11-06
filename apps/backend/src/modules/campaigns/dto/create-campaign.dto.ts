import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({
    enum: CampaignStatus,
    example: 'Scheduled',
    required: false,
    description:
      'Defaults to Draft on create; left unchanged on update when omitted',
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    example: 'This weekend only',
    description: 'Email subject line (Email campaigns)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({
    example: 'https://urbangrill.ng/menu',
    description:
      'Link the campaign promotes. Sent messages carry a tracked `/c/:id` URL that counts the click and redirects here.',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional({
    example: 'Urban Grill',
    description: 'Email sender name, shown as "<name> via VemTap"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  senderName?: string;

  @ApiPropertyOptional({
    example: 'hello@urbangrill.ng',
    description: 'Where email replies go',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  replyTo?: string;

  @ApiProperty({
    example: 'branch-uuid',
    description: 'Branch ID (optional if passed as query)',
    required: false,
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
