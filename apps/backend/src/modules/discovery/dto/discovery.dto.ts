import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

export class UpdateDiscoverySettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Allow business to be discovered by locals',
  })
  @IsOptional()
  @IsBoolean()
  joinDiscoveryNetwork?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow other businesses to request partnerships',
  })
  @IsOptional()
  @IsBoolean()
  receivePartnerRequests?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show active promotions on the network',
  })
  @IsOptional()
  @IsBoolean()
  allowPromotions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable push notifications for discovery updates',
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable SMS alerts for discovery updates',
  })
  @IsOptional()
  @IsBoolean()
  smsAlerts?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable email summary for discovery updates',
  })
  @IsOptional()
  @IsBoolean()
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'all',
    description: 'Filter type: all, from_partners, sent_to_partners, direct',
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'from_partners', 'sent_to_partners', 'direct'])
  filter?: 'all' | 'from_partners' | 'sent_to_partners' | 'direct';
}
