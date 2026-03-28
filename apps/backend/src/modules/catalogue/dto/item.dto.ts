import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CatalogueItemStatus, CatalogueItemType, DiscountType } from '../entities/catalogue-item.entity';

export class CreateCatalogueItemDto {
  @ApiProperty({ example: 'Cheeseburger' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 15.99 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Delicious cheeseburger' })
  @IsNotEmpty()
  @IsString()
  shortDescription: string;

  @ApiProperty({ example: 'Full description...' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://image.com/main.jpg' })
  @IsNotEmpty()
  @IsString()
  mainImage: string;

  @ApiPropertyOptional({ example: ['https://image.com/1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @ApiProperty({ example: 'uuid-of-category' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'CB-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ enum: CatalogueItemType, default: CatalogueItemType.PRODUCT })
  @IsOptional()
  @IsEnum(CatalogueItemType)
  itemType?: CatalogueItemType = CatalogueItemType.PRODUCT;

  @ApiPropertyOptional({ enum: DiscountType, default: DiscountType.NONE })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType = DiscountType.NONE;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowBackOrder?: boolean = true;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPoints?: number;

  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;
}

export class UpdateCatalogueItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CatalogueItemStatus })
  @IsOptional()
  @IsEnum(CatalogueItemStatus)
  status?: CatalogueItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ enum: CatalogueItemType })
  @IsOptional()
  @IsEnum(CatalogueItemType)
  itemType?: CatalogueItemType;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowBackOrder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPoints?: number;

  @ApiPropertyOptional({ description: 'If provided, the edit will be isolated to this branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'If true, updates will apply to all branches' })
  @IsOptional()
  @IsBoolean()
  applyGlobally?: boolean = false;
}

export class SuspendItemDto {
  @ApiProperty({ example: 'Policy violation' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CatalogueQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'most_popular'] })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_popular'])
  sortBy?: string = 'newest';
}
