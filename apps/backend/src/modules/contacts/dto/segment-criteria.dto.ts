import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DealCriteriaDto {
  @ApiPropertyOptional({
    description:
      'Only these offers (any branch row of a deal); omit for any deal',
    example: ['uuid-offer'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  offerIds?: string[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum redeemed claims. Omit to match any claim.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  redeemedAtLeast?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Only claims in the last N days',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  withinDays?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      "Saved one of the business's deals and never redeemed it. Independent of `offerIds`, which still means claimed; on its own it does not require a claim.",
  })
  @IsOptional()
  @IsBoolean()
  savedNotRedeemed?: boolean;
}

export class MenuCriteriaDto {
  @ApiPropertyOptional({
    example: ['uuid-item'],
    description: 'Catalogue item ids',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];

  @ApiPropertyOptional({
    example: 2,
    default: 1,
    description: 'Minimum units ordered across them',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  orderedAtLeast?: number;
}

export class LocationCriteriaDto {
  @ApiPropertyOptional({
    example: ['uuid-branch'],
    description: 'Visited / bought at any of these branches',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({
    example: ['uuid-district'],
    description:
      'Customers whose home district (the area they chose in the app) is one of these (`GET /clusters/districts`)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  homeDistrictIds?: string[];
}

export class RecencyCriteriaDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Last activity within N days',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  visitedWithinDays?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'No activity for at least N days (lapsed)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  notVisitedForDays?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'At least N visits / purchases',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minVisits?: number;

  @ApiPropertyOptional({
    example: 14,
    description:
      'Scanned a table QR or chatted with the business within N days',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  interactedWithinDays?: number;
}

export class LoyaltyCriteriaDto {
  @ApiPropertyOptional({
    example: 500,
    description: 'Unspent loyalty points at the business (earned − redeemed)',
  })
  @IsInt()
  @Min(1)
  minPoints: number;
}

export class SpendCriteriaDto {
  @ApiPropertyOptional({
    example: 50000,
    description: 'Lifetime spend at the business (₦)',
  })
  @IsOptional()
  @Min(0)
  minTotal?: number;

  @ApiPropertyOptional({ example: 20000, description: 'Average ticket (₦)' })
  @IsOptional()
  @Min(0)
  minAverageTicket?: number;
}

/**
 * Rule set for a dynamic segment. Groups are AND-ed; an empty object matches
 * every customer the business has seen.
 */
export class SegmentCriteriaDto {
  @ApiPropertyOptional({ type: DealCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DealCriteriaDto)
  deals?: DealCriteriaDto;

  @ApiPropertyOptional({ type: MenuCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MenuCriteriaDto)
  menu?: MenuCriteriaDto;

  @ApiPropertyOptional({ type: LocationCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationCriteriaDto)
  location?: LocationCriteriaDto;

  @ApiPropertyOptional({ type: RecencyCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecencyCriteriaDto)
  recency?: RecencyCriteriaDto;

  @ApiPropertyOptional({ type: SpendCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpendCriteriaDto)
  spend?: SpendCriteriaDto;

  @ApiPropertyOptional({ type: LoyaltyCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoyaltyCriteriaDto)
  loyalty?: LoyaltyCriteriaDto;
}

export class SegmentPreviewDto {
  @ApiPropertyOptional({ type: SegmentCriteriaDto })
  @ValidateNested()
  @Type(() => SegmentCriteriaDto)
  criteria: SegmentCriteriaDto;
}
