import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class PurchaseCreditPlanDto {
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
}

export class StartCreditCheckoutDto {
  @ApiPropertyOptional({
    example: 'vemtap://payment-return',
    description: 'Where Paystack sends the customer after paying',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  callbackUrl?: string;
}
