import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreatePromoCodeDto {
  @ApiProperty({
    example: 'SAVE50',
    description: 'Customer facing promo code string (will be normalized to uppercase)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Master switch to activate or suspend the promo code',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00Z',
    description: 'Optional start date when code becomes valid',
  })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Optional expiration timestamp (leave null for works forever)',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Total number of allowed global redemptions (e.g. only for 10 people, null = unlimited)',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  maxRedemptions?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'How many times a single business/user can redeem this code',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRedemptionsPerUser?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Restricts code usage to first-time subscribers only',
  })
  @IsBoolean()
  @IsOptional()
  firstTimeOnly?: boolean;

  @ApiPropertyOptional({
    example: ['uuid-biz-1'],
    description:
      'Specific business IDs allowed to use this code (empty = any business)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedBusinessIds?: string[];
}
