import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BillingPeriod } from '../entities/subscription.entity';

export class SubscribeDto {
  @ApiProperty({ description: 'The ID of the plan to subscribe to' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    description:
      'The ID of the business this subscription belongs to (Optional if branch context exists)',
  })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiProperty({
    enum: BillingPeriod,
    description: 'The billing period (monthly, quarterly, yearly)',
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiPropertyOptional({
    description: 'Paystack transaction reference for verification',
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    description: 'Whether to start a trial subscription',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isTrial?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is an admin override (no payment required)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAdminOverride?: boolean;

  @ApiPropertyOptional({
    description:
      'Custom expiration date for manually overridden subscriptions (admin only)',
  })
  @IsString()
  @IsOptional()
  customEndDate?: string;
}
