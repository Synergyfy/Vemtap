import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BillingPeriod } from '../entities/subscription.entity';

export class StartTrialDto {
  @ApiProperty({
    description: 'A paid plan with trialDurationDays > 0 (see GET /plans)',
  })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
    description: 'The billing period shown for the plan after the trial',
  })
  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;
}
