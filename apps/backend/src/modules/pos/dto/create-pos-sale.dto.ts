import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/pos-enums';

export class PosSaleItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class SplitPaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 7500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class PaymentDetailsDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 20000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  change?: number;

  @ApiPropertyOptional({ type: [SplitPaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitPaymentDto)
  splitDetails?: SplitPaymentDto[];
}

export class CreatePosSaleDto {
  @ApiProperty({ type: [PosSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosSaleItemDto)
  items: PosSaleItemDto[];

  @ApiProperty({ type: PaymentDetailsDto })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  payment: PaymentDetailsDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cartDiscountAmount?: number;

  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hideCustomerInfoOnReceipt?: boolean;

  @ApiPropertyOptional({ example: 'Paid with NGN note' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-of-client-offline-sale' })
  @IsOptional()
  @IsUUID()
  clientRef?: string;

  @ApiPropertyOptional({ example: '2026-06-28T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  orderedAt?: string;

  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;
}
