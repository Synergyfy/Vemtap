import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum PublicBusinessSortBy {
  NEWEST = 'newest',
  NAME_ASC = 'name_asc',
}

export class PublicBusinessesQueryDto {
  @ApiPropertyOptional({
    description: 'Search term matched against business name and description',
    example: 'restaurant',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by global category id (`GET /categories`)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: PublicBusinessSortBy,
    default: PublicBusinessSortBy.NEWEST,
    description: 'Sort order: newest (created desc) or name_asc (A→Z)',
  })
  @IsOptional()
  @IsEnum(PublicBusinessSortBy)
  sortBy?: PublicBusinessSortBy = PublicBusinessSortBy.NEWEST;

  @ApiPropertyOptional({
    description: 'Latitude for the proximity filter (requires lat+lng+radius)',
    example: 9.0718,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for the proximity filter (requires lat+lng+radius)',
    example: 7.4843,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description:
      'Radius in kilometres. Ignored unless lat and lng are both provided.',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({ description: 'Max results', default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 8;
}

export class PublicSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description:
      'Max results per result group (deals/businesses/categories/products)',
    default: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;

  @ApiPropertyOptional({
    description:
      'Latitude for the proximity filter (requires lat+lng+radius). Applies to deals, businesses and products.',
    example: 9.0133,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for the proximity filter (requires lat+lng+radius)',
    example: 7.4911,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description:
      'Radius in kilometres. Ignored unless lat and lng are both provided.',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;
}
