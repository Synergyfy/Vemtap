import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ProductStatus } from '../entities/product.entity';

export enum ProductSortField {
  CREATED_AT = 'createdAt',
  PRICE = 'price',
  NAME = 'name',
  RATING = 'rating',
  MOQ = 'moq',
}

export enum ProductSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for product name/description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Product type (category) filter — by id, name, or slug',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by productTypeId (legacy alias)',
  })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ProductSortField,
    default: ProductSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy?: ProductSortField = ProductSortField.CREATED_AT;

  @ApiPropertyOptional({
    enum: ProductSortOrder,
    default: ProductSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sortOrder?: ProductSortOrder = ProductSortOrder.DESC;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
