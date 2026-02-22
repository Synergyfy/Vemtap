import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'T123456789', required: false })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
