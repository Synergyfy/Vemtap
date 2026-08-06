import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/pos-enums';

export class RefundItemDto {
  @ApiProperty({ example: 'uuid-of-sale-item' })
  @IsNotEmpty()
  @IsUUID()
  saleItemId: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdatePosSaleStatusDto {
  @ApiProperty({ enum: SaleStatus, example: SaleStatus.REFUNDED })
  @IsNotEmpty()
  @IsEnum(SaleStatus)
  status: SaleStatus;

  @ApiPropertyOptional({ example: 'Customer changed their mind' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Items to refund (for partial refunds). If omitted, a full refund is processed.',
    type: [RefundItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  refundItems?: RefundItemDto[];
}
