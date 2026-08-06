import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class PurchaseCustomCreditsDto {
  @ApiProperty({
    example: 'T123456789',
    description: 'Paystack transaction reference',
  })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'The ID of the branch purchasing credits',
  })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    example: 100,
    description: 'Number of SMS credits to purchase',
  })
  @IsNumber()
  @Min(0)
  smsAmount: number;

  @ApiProperty({
    example: 50,
    description: 'Number of WhatsApp credits to purchase',
  })
  @IsNumber()
  @Min(0)
  whatsappAmount: number;

  @ApiProperty({
    example: 200,
    description: 'Number of Email credits to purchase',
  })
  @IsNumber()
  @Min(0)
  emailAmount: number;

  @ApiProperty({
    example: 50,
    description: 'Number of AI credits to purchase',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  aiAmount?: number;
}
