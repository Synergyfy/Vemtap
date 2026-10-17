import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const CUSTOMER_SEGMENTS = [
  'all',
  'frequent',
  'returning',
  'new',
  'inactive',
] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const CUSTOMER_SORTS = ['recent', 'spend', 'visits', 'name'] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export class CustomerDirectoryQueryDto {
  @ApiPropertyOptional({
    description: 'Name, email or phone (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_SEGMENTS, default: 'all' })
  @IsOptional()
  @IsIn(CUSTOMER_SEGMENTS)
  segment?: CustomerSegment;

  @ApiPropertyOptional({ description: 'Customers who touched this branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_SORTS, default: 'recent' })
  @IsOptional()
  @IsIn(CUSTOMER_SORTS)
  sort?: CustomerSort;

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

export class SaveCustomerNoteDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? [
          ...new Set(value.map((tag) => String(tag).trim().toLowerCase())),
        ].filter(Boolean)
      : value,
  )
  tags?: string[];
}
