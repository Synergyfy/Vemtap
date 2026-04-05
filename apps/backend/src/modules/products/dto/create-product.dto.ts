import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../entities/product.entity';
import { Type } from 'class-transformer';

export class HowToUseDto {
  @ApiProperty({ example: 'Step 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Scan the QR code' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'NFC Card' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SKU-001', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'High quality NFC card' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 1200, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ example: 500, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 50, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  customizationFee?: number;

  @ApiProperty({ example: 'nfce', required: false })
  @IsString()
  @IsOptional()
  nfcType?: string;

  @ApiProperty({ example: ['https://example.com/image.png'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  images: string[];

  @ApiProperty({
    example: ['https://example.com/video.mp4'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @ApiProperty({
    example: { weight: '20g', material: 'Plastic' },
    required: false,
    description: 'Technical specifications as key-value pairs',
  })
  @IsObject()
  @IsOptional()
  technicalSpecifications?: Record<string, string>;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  customBrandedCards?: boolean;

  @ApiProperty({ example: 'Hardware' })
  @IsString()
  @IsNotEmpty()
  tag: string;

  @ApiProperty({ example: 'bg-blue-500', required: false })
  @IsString()
  @IsOptional()
  tagColor?: string;

  @ApiProperty({
    type: [HowToUseDto],
    example: [{ title: 'Step 1', description: 'Scan the QR code' }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HowToUseDto)
  howToUse?: HowToUseDto[];

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
    example: '[{"min": 1, "max": 100, "price": 20000}]',
    required: false,
  })
  @IsOptional()
  priceTiers?: { min: number; max: number | null; price: number }[];

  @ApiProperty({ example: 300, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  requestQuoteThreshold?: number;

  @ApiProperty({
    enum: ProductStatus,
    default: ProductStatus.PUBLISHED,
    required: false,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ example: 'type-uuid', required: false })
  @IsString()
  @IsOptional()
  productTypeId?: string;
}
