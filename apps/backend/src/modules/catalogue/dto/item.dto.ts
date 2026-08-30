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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CatalogueItemStatus,
  CatalogueItemType,
  DiscountType,
  ServicePriceType,
  ServiceMode,
  ServiceBookingMethod,
} from '../entities/catalogue-item.entity';

export class CreateCatalogueItemDto {
  @ApiProperty({ example: 'Cheeseburger' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 15.99, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number = 0;

  @ApiPropertyOptional({ example: 'Delicious cheeseburger' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: 'Full description...' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://image.com/main.jpg' })
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiPropertyOptional({ example: ['https://image.com/1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'CB-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    enum: CatalogueItemType,
    default: CatalogueItemType.PRODUCT,
  })
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

  @ApiPropertyOptional({ example: 'VMT0001' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'House Made' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: '500 g' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ example: '10x15x5 cm' })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional({ example: [{ type: 'size', value: 'large' }] })
  @IsOptional()
  variants?: { type: string; value: string }[];

  @ApiPropertyOptional({ example: ['burger', 'beef'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableLoyaltyPoints?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPointsValue?: number;

  @ApiPropertyOptional({
    enum: ServicePriceType,
    default: ServicePriceType.FIXED,
  })
  @IsOptional()
  @IsEnum(ServicePriceType)
  priceType?: ServicePriceType = ServicePriceType.FIXED;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceRangeMin?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceRangeMax?: number;

  @ApiPropertyOptional({ example: '45 mins' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({
    enum: ServiceMode,
    default: ServiceMode.LOCATION,
  })
  @IsOptional()
  @IsEnum(ServiceMode)
  serviceMode?: ServiceMode = ServiceMode.LOCATION;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean = false;

  @ApiPropertyOptional({ enum: ServiceBookingMethod })
  @IsOptional()
  @IsEnum(ServiceBookingMethod)
  bookingMethod?: ServiceBookingMethod;

  @ApiPropertyOptional({ example: 'https://calendly.com/my-booking' })
  @IsOptional()
  @IsString()
  externalBookingLink?: string;

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
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: '500 g' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ example: '10x15x5 cm' })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  variants?: { type: string; value: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableLoyaltyPoints?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPointsValue?: number;

  @ApiPropertyOptional({ enum: ServicePriceType })
  @IsOptional()
  @IsEnum(ServicePriceType)
  priceType?: ServicePriceType;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceRangeMin?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceRangeMax?: number;

  @ApiPropertyOptional({ example: '45 mins' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ enum: ServiceMode })
  @IsOptional()
  @IsEnum(ServiceMode)
  serviceMode?: ServiceMode;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @ApiPropertyOptional({ enum: ServiceBookingMethod })
  @IsOptional()
  @IsEnum(ServiceBookingMethod)
  bookingMethod?: ServiceBookingMethod;

  @ApiPropertyOptional({ example: 'https://calendly.com/my-booking' })
  @IsOptional()
  @IsString()
  externalBookingLink?: string;

  @ApiPropertyOptional({
    description: 'If provided, the edit will be isolated to this branch',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'If true, updates will apply to all branches',
  })
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

  @ApiPropertyOptional({ enum: CatalogueItemType })
  @IsOptional()
  @IsEnum(CatalogueItemType)
  itemType?: CatalogueItemType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ['newest', 'oldest', 'most_popular', 'price_asc', 'price_desc'],
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_popular', 'price_asc', 'price_desc'])
  sortBy?: string = 'newest';
}

export class BulkImportItemRowDto {
  @ApiProperty({ example: 'Example Product' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 99.99 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Short description...' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Full description...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 'EXMP-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class BulkImportItemsDto {
  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ type: [BulkImportItemRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportItemRowDto)
  items: BulkImportItemRowDto[];
}
