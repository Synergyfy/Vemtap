import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsArray,
  ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HoldSaleItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'Classic Beef Burger' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiPropertyOptional({ example: 'FF-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'VMT0001' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 4500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

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

  @ApiProperty({ example: 9000 })
  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;
}

export class HoldPosSaleDto {
  @ApiProperty({ type: [HoldSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HoldSaleItemDto)
  items: HoldSaleItemDto[];

  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Waiting for customer approval' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  total?: number;
}
