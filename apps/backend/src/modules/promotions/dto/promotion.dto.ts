import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SponsoredCampaignStatus } from '../../discovery/entities/sponsored-campaign.entity';
import {
  AUDIENCE_SCOPES,
  BOOST_GOALS,
  DAYPART_WINDOWS,
  PLACEMENTS,
  PROMOTION_COHORTS,
  PROMOTION_OBJECTIVES,
  PROMOTION_STRATEGIES,
} from '../promotions.constants';

const ids = (list: readonly { id: string }[]) => list.map((entry) => entry.id);

export class CampaignAssetDto {
  @ApiProperty({ enum: ['deal', 'product', 'service', 'profile'] })
  @IsIn(['deal', 'product', 'service', 'profile'])
  type: 'deal' | 'product' | 'service' | 'profile';

  @ApiProperty({
    description: 'Offer id, catalogue item id, or business id for `profile`',
  })
  @IsUUID()
  id: string;
}

export class CampaignAudienceDto {
  @ApiPropertyOptional({
    enum: [...new Set([...ids(PROMOTION_STRATEGIES), ...ids(AUDIENCE_SCOPES)])],
    description:
      'Promotion: nearby | segments. Boost scope: nearby | districts | clusters.',
  })
  @IsOptional()
  @IsIn([...new Set([...ids(PROMOTION_STRATEGIES), ...ids(AUDIENCE_SCOPES)])])
  strategy?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  segmentIds?: string[];

  @ApiPropertyOptional({ enum: ids(PROMOTION_COHORTS), isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(ids(PROMOTION_COHORTS), { each: true })
  cohorts?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Branches the campaign targets around',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  clusterIds?: string[];

  @ApiPropertyOptional({ example: 3, enum: [1, 3, 5, 10] })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm?: number;
}

export class CampaignScheduleDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Go live on launch rather than at startAt',
  })
  @IsOptional()
  @IsBoolean()
  instantLaunch?: boolean;

  @ApiPropertyOptional({ example: '2026-10-20T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  dayparting?: boolean;

  @ApiPropertyOptional({ enum: ids(DAYPART_WINDOWS), isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(ids(DAYPART_WINDOWS), { each: true })
  windows?: string[];

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description: '0 = Sunday … 6 = Saturday',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays?: number[];

  @ApiPropertyOptional({
    example: false,
    description: 'Run again for the same duration when it ends, if funds allow',
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

/**
 * A boost or promotion draft. Every field is optional so each wizard step can
 * save what it has; `launch` checks that everything needed is present.
 */
export class SaveCampaignDto {
  @ApiPropertyOptional({ example: 'Lunch combo push' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    enum: ids(PROMOTION_OBJECTIVES),
    description: 'Promotions only',
  })
  @IsOptional()
  @IsIn(ids(PROMOTION_OBJECTIVES))
  objective?: string;

  @ApiPropertyOptional({ enum: ids(BOOST_GOALS), description: 'Boosts only' })
  @IsOptional()
  @IsIn(ids(BOOST_GOALS))
  goalId?: string;

  @ApiPropertyOptional({
    type: [CampaignAssetDto],
    description: 'A boost has exactly one asset',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CampaignAssetDto)
  assets?: CampaignAssetDto[];

  @ApiPropertyOptional({ type: CampaignAudienceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignAudienceDto)
  audience?: CampaignAudienceDto;

  @ApiPropertyOptional({ enum: ids(PLACEMENTS), isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(ids(PLACEMENTS), { each: true })
  placements?: string[];

  @ApiPropertyOptional({ type: CampaignScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignScheduleDto)
  schedule?: CampaignScheduleDto;

  @ApiPropertyOptional({ enum: ['total', 'daily'], default: 'total' })
  @IsOptional()
  @IsIn(['total', 'daily'])
  budgetMode?: 'total' | 'daily';

  @ApiPropertyOptional({
    example: 20000,
    description: 'Total budget (₦) when budgetMode is total',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    example: 4000,
    description: 'Per-day budget (₦) when budgetMode is daily',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyBudget?: number;

  @ApiPropertyOptional({
    description: 'Branch the campaign belongs to (defaults to the main branch)',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class LaunchCampaignDto {
  @ApiPropertyOptional({
    enum: ['wallet', 'card'],
    default: 'wallet',
    description:
      '`wallet` reserves the budget now. `card` tops the wallet up by the shortfall via Paystack and launches once paid.',
  })
  @IsOptional()
  @IsIn(['wallet', 'card'])
  fundingSource?: 'wallet' | 'card';

  @ApiPropertyOptional({ description: 'Paystack return URL for card funding' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  callbackUrl?: string;
}

export class ListCampaignsQueryDto {
  @ApiPropertyOptional({ enum: SponsoredCampaignStatus })
  @IsOptional()
  @IsEnum(SponsoredCampaignStatus)
  status?: SponsoredCampaignStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ForecastDto {
  @ApiPropertyOptional({ example: 20000, description: 'Total budget (₦)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    example: 4000,
    description: 'Per-day budget (₦); with durationDays',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyBudget?: number;

  @ApiPropertyOptional({ example: 7, default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays?: number;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm?: number;
}
