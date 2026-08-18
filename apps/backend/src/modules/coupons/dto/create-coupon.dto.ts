import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DiscountType,
  CouponDuration,
} from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({
    example: 'Q3 Growth Discount',
    description: 'Internal descriptive name of the coupon',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'PERCENTAGE or FIXED_AMOUNT',
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    example: 20,
    description: 'Discount amount (percentage e.g. 20 or fixed e.g. 5000)',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'NGN',
    default: 'NGN',
    description: 'Currency if discountType is FIXED_AMOUNT',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: 10000,
    description:
      'Optional maximum discount amount for percentage discounts (cap)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Minimum plan subtotal required to apply this discount',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minSubtotal?: number;

  @ApiPropertyOptional({
    enum: CouponDuration,
    default: CouponDuration.ONCE,
    description: 'ONCE, REPEATING, or FOREVER',
  })
  @IsEnum(CouponDuration)
  @IsOptional()
  duration?: CouponDuration;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Number of recurring months the coupon applies (required if duration is REPEATING)',
  })
  @ValidateIf((o) => o.duration === CouponDuration.REPEATING)
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationInMonths?: number;

  @ApiPropertyOptional({
    example: ['uuid-plan-1', 'uuid-plan-2'],
    description: 'Plan IDs this coupon can be used with (empty = all plans)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicablePlanIds?: string[];

  @ApiPropertyOptional({
    example: ['monthly', 'quarterly', 'yearly'],
    description:
      'Billing cycles this coupon can be used with (empty = all cycles)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableBillingPeriods?: string[];

  @ApiPropertyOptional({
    default: true,
    description: 'Whether this coupon is immediately active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
