import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BillingPeriod } from '../entities/subscription.entity';

export class SubscribeDto {
    @ApiProperty({ description: 'The ID of the plan to subscribe to' })
    @IsString()
    @IsNotEmpty()
    planId: string;

    @ApiProperty({ description: 'The ID of the business this subscription belongs to' })
    @IsString()
    @IsNotEmpty()
    businessId: string;

    @ApiProperty({ enum: BillingPeriod, description: 'The billing period (monthly, quarterly, yearly)' })
    @IsEnum(BillingPeriod)
    billingPeriod: BillingPeriod;

    @ApiPropertyOptional({ description: 'Paystack transaction reference for verification' })
    @IsString()
    @IsOptional()
    paymentReference?: string;
}
