import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'NFC Card' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High quality NFC card' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'https://example.com/image.png' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ example: 'Hardware' })
  @IsString()
  @IsNotEmpty()
  tag: string;

  @ApiProperty({ example: 'bg-blue-500', required: false })
  @IsString()
  @IsOptional()
  tagColor?: string;

  @ApiProperty({ example: 4.5, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;

  @ApiProperty({ example: 50, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  moq?: number;

  @ApiProperty({
    enum: ProductStatus,
    default: ProductStatus.PUBLISHED,
    required: false,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
