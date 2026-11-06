import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PosOrderType } from '../pos-settings.types';
import { PaymentMethod } from '../entities/pos-enums';
import { SplitPaymentDto } from './create-pos-sale.dto';

export class ProcessPosOrderPaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method used',
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 20000,
    description: 'Total amount tendered by the customer',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Change returned to the customer',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  change?: number;

  @ApiPropertyOptional({
    type: [SplitPaymentDto],
    example: [
      { method: PaymentMethod.CASH, amount: 10000 },
      { method: PaymentMethod.TRANSFER, amount: 10000 },
    ],
    description:
      'Split payment details (required when paymentMethod is "split")',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitPaymentDto)
  splitDetails?: SplitPaymentDto[];

  @ApiPropertyOptional({
    example: false,
    description: 'Hide customer info on receipt',
  })
  @IsOptional()
  @IsBoolean()
  hideCustomerInfoOnReceipt?: boolean;

  @ApiPropertyOptional({
    enum: ['dine_in', 'takeaway'],
    default: 'dine_in',
    description:
      'Decides takeaway VAT exemption and packaging fee from the POS settings.',
  })
  @IsOptional()
  @IsIn(['dine_in', 'takeaway'])
  orderType?: PosOrderType;

  @ApiPropertyOptional({
    example: false,
    description:
      'Drop the service charge for this ticket. Ignored unless the settings allow waiving it.',
  })
  @IsOptional()
  @IsBoolean()
  waiveServiceCharge?: boolean;
}
