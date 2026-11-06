import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const REFERRAL_STATUSES = [
  'all',
  'registered',
  'pending',
  'verified',
  'notQualified',
] as const;
export type ReferralStatusFilter = (typeof REFERRAL_STATUSES)[number];

export class ReferralsQueryDto {
  @ApiPropertyOptional({ enum: REFERRAL_STATUSES, default: 'all' })
  @IsOptional()
  @IsIn(REFERRAL_STATUSES)
  status?: ReferralStatusFilter;

  @ApiPropertyOptional({ description: 'Business name (case-insensitive)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DiscoveryQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to the main branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
