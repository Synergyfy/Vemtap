import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive } from 'class-validator';

export class PurchaseAiCreditsDto {
  @ApiProperty({ description: 'Number of AI credits to purchase', example: 50 })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({
    description: 'Payment amount in kobo (NGN)',
    example: 500000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Paystack transaction reference',
    example: 'T123456789',
  })
  @IsString()
  reference: string;
}
