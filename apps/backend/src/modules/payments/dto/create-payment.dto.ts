import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPurpose, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 'T123456789' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
  purpose: PaymentPurpose;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  businessId?: string;
}
