import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BillingPeriod } from '../../subscriptions/entities/subscription.entity';

export class ValidatePromoCodeDto {
  @ApiProperty({
    example: 'SAVE50',
    description: 'The coupon/promo code string to validate',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'uuid-plan-id',
    description: 'Target plan ID the customer wants to subscribe to',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    enum: BillingPeriod,
    example: BillingPeriod.MONTHLY,
    description: 'Target billing cycle (monthly, quarterly, yearly)',
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiPropertyOptional({
    example: 'uuid-business-id',
    description:
      'The business ID attempting to use the code (optional if token user context exists)',
  })
  @IsString()
  @IsOptional()
  businessId?: string;
}
