import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

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
    description: 'The ID of the business purchasing credits',
  })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
