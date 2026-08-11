import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ClusterDealsSortBy {
  FAIR = 'fair',
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISTANCE_ASC = 'distance_asc',
  DISTANCE_DESC = 'distance_desc',
}

export class ClusterDealsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'grill' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ClusterDealsSortBy,
    default: ClusterDealsSortBy.FAIR,
  })
  @IsOptional()
  @IsEnum(ClusterDealsSortBy)
  sortBy?: ClusterDealsSortBy;

  @ApiPropertyOptional({
    description: 'Customer latitude — used as distance reference point',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Customer longitude — used as distance reference point',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}
