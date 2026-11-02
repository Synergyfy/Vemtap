import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export const DEAL_STATUS_FILTERS = [
  'active',
  'scheduled',
  'expired',
  'paused',
] as const;
export type DealStatusFilter = (typeof DEAL_STATUS_FILTERS)[number];

export const PAYMENT_METHOD_FILTERS = ['card', 'transfer', 'cash'] as const;
export type PaymentMethodFilter = (typeof PAYMENT_METHOD_FILTERS)[number];

export const CUSTOMER_COHORTS = ['new', 'returning', 'lapsed', 'vip'] as const;
export type CustomerCohort = (typeof CUSTOMER_COHORTS)[number];

/** `a,b` or repeated `?x=a&x=b` → `['a', 'b']`; empty → undefined. */
const toList = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw: unknown[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const list = raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
};

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

  @ApiPropertyOptional({
    enum: DEAL_STATUS_FILTERS,
    isArray: true,
    description:
      'Deals module: only deals in these states (comma-separated). `active` = running now, `scheduled` = starts later, `expired` = ended, `paused` = switched off',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsIn(DEAL_STATUS_FILTERS, { each: true })
  dealStatus?: DealStatusFilter[];

  @ApiPropertyOptional({
    enum: PAYMENT_METHOD_FILTERS,
    isArray: true,
    description:
      'POS module: only sales settled by these methods (comma-separated); a split sale counts when any part used one',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsIn(PAYMENT_METHOD_FILTERS, { each: true })
  paymentMethod?: PaymentMethodFilter[];

  @ApiPropertyOptional({
    isArray: true,
    description:
      'POS module: only sales rung up on these tills (comma-separated till ids)',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsUUID('all', { each: true })
  tillId?: string[];

  @ApiPropertyOptional({
    enum: CUSTOMER_COHORTS,
    description:
      'Customers module: limit the top-customers list to one segment',
  })
  @IsOptional()
  @IsIn(CUSTOMER_COHORTS)
  cohort?: CustomerCohort;
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
