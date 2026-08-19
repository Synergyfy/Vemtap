import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingPeriod } from '../../entities/subscription.entity';
import { Transform } from 'class-transformer';

export class PricePreviewDto {
  @ApiProperty({
    description: 'Plan ID to preview price for',
    example: 'uuid-plan-id',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    enum: BillingPeriod,
    description: 'Billing cycle',
    example: BillingPeriod.MONTHLY,
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiPropertyOptional({
    description: 'Optional array of add-on IDs included in checkout',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parts = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return parts.length > 0 ? parts : undefined;
    }
    if (Array.isArray(value)) {
      const filtered = value
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());
      return filtered.length > 0 ? filtered : undefined;
    }
    return undefined;
  })
  addonIds?: string[];

  @ApiPropertyOptional({
    description: 'Quantities for respective add-ons',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parts = value
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return parts.length > 0 ? parts : undefined;
    }
    if (Array.isArray(value)) {
      const mapped = value
        .map((v) => (typeof v === 'number' ? v : parseInt(String(v).trim(), 10)))
        .filter((n) => !isNaN(n));
      return mapped.length > 0 ? mapped : undefined;
    }
    return undefined;
  })
  addonQuantities?: number[];

  @ApiPropertyOptional({
    description: 'Optional promotion or coupon code to apply discount in preview',
    example: 'SAVE50',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  promoCode?: string;
}

