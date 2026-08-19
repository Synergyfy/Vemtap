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
    if (typeof value === 'string') return [value];
    return value;
  })
  addonIds?: string[];

  @ApiPropertyOptional({
    description: 'Quantities for respective add-ons',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [parseInt(value, 10)];
    if (Array.isArray(value)) return value.map((v) => parseInt(v, 10));
    return value;
  })
  addonQuantities?: number[];

  @ApiPropertyOptional({
    description: 'Optional promotion or coupon code to apply discount in preview',
    example: 'SAVE50',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

