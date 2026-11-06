import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export const ACTIVITY_KINDS = [
  'all',
  'claims',
  'orders',
  'bookings',
  'visits',
  'reviews',
] as const;
export type ActivityKindFilter = (typeof ACTIVITY_KINDS)[number];

export class ActivityQueryDto {
  @ApiPropertyOptional({ enum: ACTIVITY_KINDS, default: 'all' })
  @IsOptional()
  @IsIn(ACTIVITY_KINDS)
  kind?: ActivityKindFilter;

  @ApiPropertyOptional({
    description: 'Only activity on or after this ISO date',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

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

export class ActivitySummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Only activity on or after this ISO date',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;
}
