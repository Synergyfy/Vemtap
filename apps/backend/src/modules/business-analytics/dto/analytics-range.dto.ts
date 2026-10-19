import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class AnalyticsRangeQueryDto {
  @ApiPropertyOptional({
    description: 'ISO date or datetime; defaults to 29 days before `to`',
    example: '2026-09-17',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'ISO date or datetime (exclusive); defaults to now',
    example: '2026-10-17',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Limit to one branch of the business; omit for all branches',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export const EXPORT_MODULES = [
  'overview',
  'customers',
  'deals',
  'locations',
  'pos',
  'audit',
] as const;
export type ExportModule = (typeof EXPORT_MODULES)[number];

export const EXPORT_FORMATS = ['csv', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export class AnalyticsExportDto extends AnalyticsRangeQueryDto {
  @ApiPropertyOptional({ enum: EXPORT_FORMATS, default: 'csv' })
  @IsOptional()
  @IsIn(EXPORT_FORMATS)
  format?: ExportFormat;

  @ApiPropertyOptional({
    enum: EXPORT_MODULES,
    isArray: true,
    description: 'Report sections to include; defaults to every section',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(EXPORT_MODULES, { each: true })
  modules?: ExportModule[];
}
