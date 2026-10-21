import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SHOWCASE_ENTITY_TYPES } from '../entities/cluster-showcase-item.entity';

export const CLUSTER_KINDS = [
  'mall',
  'plaza',
  'market',
  'commercial-axis',
  'strip',
] as const;
export const SHOWCASE_PREFERENCES = [
  'all',
  'deals',
  'products',
  'services',
  'profile',
] as const;

/** Most routes act for one branch: the given one (of the caller's business) or the caller's own. */
export class BranchScopeDto {
  @ApiPropertyOptional({
    description: 'A branch of the caller’s business; defaults to theirs',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class ProposeClusterDto extends BranchScopeDto {
  @ApiProperty({ example: 'Amaka Mall' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: CLUSTER_KINDS, example: 'mall' })
  @IsIn(CLUSTER_KINDS)
  kind: (typeof CLUSTER_KINDS)[number];

  @ApiPropertyOptional({ example: 'Plot 12 Adetokunbo Ademola Crescent' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Abuja' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'FCT' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @ApiProperty({ example: 9.0765 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 7.3986 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({
    example: 300,
    minimum: 50,
    maximum: 3000,
    default: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(3000)
  radiusMeters?: number;

  @ApiPropertyOptional({ example: 'Three-floor mall with 60 shops' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ClusterMembersQueryDto extends BranchScopeDto {
  @ApiPropertyOptional({ example: 'grill' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class ShowcaseToggleDto {
  @ApiProperty({ enum: SHOWCASE_ENTITY_TYPES, example: 'deal' })
  @IsIn(SHOWCASE_ENTITY_TYPES)
  type: (typeof SHOWCASE_ENTITY_TYPES)[number];

  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  show: boolean;
}

export class UpdateShowcaseDto extends BranchScopeDto {
  @ApiProperty({ type: [ShowcaseToggleDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ShowcaseToggleDto)
  items: ShowcaseToggleDto[];
}

export class ShowcasePreferenceDto extends BranchScopeDto {
  @ApiProperty({ enum: SHOWCASE_PREFERENCES, example: 'deals' })
  @IsIn(SHOWCASE_PREFERENCES)
  showcase: (typeof SHOWCASE_PREFERENCES)[number];
}

export class ClusterChatQueryDto extends BranchScopeDto {
  @ApiPropertyOptional({
    description: 'Messages older than this (ISO), for paging back',
  })
  @IsOptional()
  @IsDateString()
  before?: string;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class SendClusterMessageDto extends BranchScopeDto {
  @ApiProperty({ example: 'Hi! Want to run a joint weekend promo?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
