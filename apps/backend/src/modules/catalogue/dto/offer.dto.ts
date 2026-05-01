import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CatalogueOfferPricingType,
  CatalogueOfferStatus,
} from '../entities/catalogue-offer.entity';

export class CreateCatalogueOfferDto {
  @ApiProperty({ example: 'Summer Deal' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Get 2 burgers and a drink for less!' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://image.com/offer.jpg' })
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiPropertyOptional({ example: ['https://image.com/offer1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @ApiProperty({
    enum: CatalogueOfferPricingType,
    default: CatalogueOfferPricingType.SUM,
  })
  @IsNotEmpty()
  @IsEnum(CatalogueOfferPricingType)
  pricingType: CatalogueOfferPricingType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  fixedPrice?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPoints?: number;

  @ApiPropertyOptional({ example: 'uuid-of-reward' })
  @IsOptional()
  @IsUUID()
  rewardId?: string;

  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: ['uuid-of-item-1', 'uuid-of-item-2'] })
  @IsNotEmpty()
  @IsArray()
  @IsUUID(undefined, { each: true })
  itemIds: string[];
}

export class UpdateCatalogueOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

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
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ enum: CatalogueOfferPricingType })
  @IsOptional()
  @IsEnum(CatalogueOfferPricingType)
  pricingType?: CatalogueOfferPricingType;

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
  fixedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  loyaltyPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rewardId?: string;

  @ApiPropertyOptional({ enum: CatalogueOfferStatus })
  @IsOptional()
  @IsEnum(CatalogueOfferStatus)
  status?: CatalogueOfferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  itemIds?: string[];
}

export class CatalogueOfferQueryDto {
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
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
