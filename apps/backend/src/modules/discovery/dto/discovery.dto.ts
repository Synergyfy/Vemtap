import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
} from 'class-validator';

export class UpdateDiscoverySettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Allow business to be discovered by locals',
  })
  @IsBoolean()
  @IsOptional()
  joinDiscoveryNetwork?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow other businesses to request partnerships',
  })
  @IsBoolean()
  @IsOptional()
  receivePartnerRequests?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show active promotions on the network',
  })
  @IsBoolean()
  @IsOptional()
  allowPromotions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable push notifications for discovery updates',
  })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable SMS alerts for discovery updates',
  })
  @IsBoolean()
  @IsOptional()
  smsAlerts?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable email summary for discovery updates',
  })
  @IsBoolean()
  @IsOptional()
  emailSummary?: boolean;
}

export class RecommendBusinessDto {
  @ApiProperty({
    example: "Joe's Barbershop",
    description: 'Name of the recommended business',
  })
  @IsNotEmpty()
  @IsString()
  businessName: string;

  @ApiProperty({
    example: 'Joe Smith',
    description: "Name of the business's owner",
  })
  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @ApiProperty({
    example: '+234 800 000 0000',
    description: "Owner's phone number",
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'joe@example.com',
    description: "Owner's email address",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '123 Main Street, Lagos',
    description: 'Business address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Great local traffic, highly complementary to our gym.',
    description: 'Reason for recommendation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DiscoveryQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    example: 'all',
    description: 'Filter type: all, from_partners, sent_to_partners, direct',
  })
  @IsOptional()
  @IsString()
  filter?: 'all' | 'from_partners' | 'sent_to_partners' | 'direct';
}
