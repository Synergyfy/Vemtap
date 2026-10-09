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
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  CatalogueOfferPricingType,
  CatalogueOfferStatus,
} from '../entities/catalogue-offer.entity';

/**
 * Sort values supported by the global public offers feed.
 * Unknown values are rejected with 400 (nothing silently falls back).
 */
export enum PublicOffersSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  TRENDING = 'trending',
  POPULAR = 'popular',
  FEATURED = 'featured',
}

/** Sort values supported by the branch-scoped public offers feed. */
export enum BranchOffersSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

/**
 * Audience values accepted by the public offers feed:
 * - `everyone_nearby` / `all` → no audience filter (everyone sees it)
 * - `new_customers` / `returning_customers` → filters on the offer's
 *   `audienceTarget` eligibility (the same field enforced at claim time)
 */
export enum OfferAudience {
  EVERYONE_NEARBY = 'everyone_nearby',
  ALL = 'all',
  NEW_CUSTOMERS = 'new_customers',
  RETURNING_CUSTOMERS = 'returning_customers',
}

export class CreateCatalogueOfferDto {
  @ApiProperty({ example: 'Summer Deal' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Get 2 burgers and a drink for less!',
    default: '',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value : ''))
  description?: string = '';

  @ApiPropertyOptional({
    example: 'uuid-of-source-item',
    description: 'Source catalogue item ID if created from a product/service',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : value?.trim(),
  )
  @IsUUID('4', { message: 'sourceProductId must be a valid UUID v4' })
  sourceProductId?: string;

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

  @ApiPropertyOptional({ example: ['uuid-of-item-1', 'uuid-of-item-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  itemIds?: string[];

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'discount' })
  @IsOptional()
  @IsString()
  offerType?: string;

  @ApiPropertyOptional({ example: 'everyone_nearby' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({
    example: [
      'Valid during business hours',
      'Cannot be combined with other offers',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];

  @ApiPropertyOptional({ example: 'VEM' })
  @IsOptional()
  @IsString()
  claimCodePrefix?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxClaimsPerCustomer?: number;

  @ApiPropertyOptional({ example: 'all' })
  @IsOptional()
  @IsString()
  audienceTarget?: string;

  @ApiPropertyOptional({ example: 'same_area' })
  @IsOptional()
  @IsString()
  deliveryScope?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  deliveryRadius?: number;

  @ApiPropertyOptional({ example: 'km' })
  @IsOptional()
  @IsString()
  deliveryUnit?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsOptional()
  @IsString()
  deliveryRegion?: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({
    example: 'Full terms, offer details, and eligible items description',
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiPropertyOptional({
    description: 'Whether the offer is featured',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateCatalogueOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the offer is featured',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 'uuid-of-source-item',
    description: 'Source catalogue item ID if created from a product/service',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : value?.trim(),
  )
  @IsUUID('4', { message: 'sourceProductId must be a valid UUID v4' })
  sourceProductId?: string;

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

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'discount' })
  @IsOptional()
  @IsString()
  offerType?: string;

  @ApiPropertyOptional({ example: 'everyone_nearby' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  claimCodePrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxClaimsPerCustomer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audienceTarget?: string;

  @ApiPropertyOptional({ example: 'same_area' })
  @IsOptional()
  @IsString()
  deliveryScope?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  deliveryRadius?: number;

  @ApiPropertyOptional({ example: 'km' })
  @IsOptional()
  @IsString()
  deliveryUnit?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsOptional()
  @IsString()
  deliveryRegion?: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({
    example: 'Full terms, offer details, and eligible items description',
  })
  @IsOptional()
  @IsString()
  longDescription?: string;
}

export class GenerateOfferTermsDto {
  @ApiPropertyOptional({ example: 'Summer Special Buy 1 Get 1 Free' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Summer Special Buy 1 Get 1 Free' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Enjoy 50% off all summer beverages and snacks',
  })
  @IsOptional()
  @IsString()
  description?: string;
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

  @ApiPropertyOptional({
    enum: BranchOffersSortBy,
    default: BranchOffersSortBy.NEWEST,
    description: 'Sort order: newest | oldest | price_asc | price_desc',
  })
  @IsOptional()
  @IsEnum(BranchOffersSortBy)
  sortBy?: BranchOffersSortBy = BranchOffersSortBy.NEWEST;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Opaque cursor from a previous page (or `nextCursor`)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Alias of `cursor` accepted for convenience',
  })
  @IsOptional()
  @IsString()
  nextCursor?: string;
}

export class PublicCatalogueOffersQueryDto {
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

  @ApiPropertyOptional({
    enum: PublicOffersSortBy,
    default: PublicOffersSortBy.NEWEST,
    description:
      'Sort order: newest | oldest | price_asc | price_desc | trending | popular | featured. Invalid values return 400. `popular`/`featured` use offset pagination (no cursor).',
  })
  @IsOptional()
  @IsEnum(PublicOffersSortBy)
  sortBy?: PublicOffersSortBy = PublicOffersSortBy.NEWEST;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

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
    description:
      'Minimum effective discount percent (0–100), computed from the sum of the offer item prices vs the deal price. 0 disables the filter.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({
    enum: OfferAudience,
    description:
      'Audience filter. `everyone_nearby`/`all` apply no filter; `new_customers`/`returning_customers` filter on the claim-time eligibility (`audienceTarget`).',
  })
  @IsOptional()
  @IsEnum(OfferAudience)
  audience?: OfferAudience;

  @ApiPropertyOptional({
    description: 'Opaque cursor from a previous page (or `nextCursor`)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Alias of `cursor` accepted for convenience',
  })
  @IsOptional()
  @IsString()
  nextCursor?: string;
}

export enum AdminDealsSortBy {
  NEWEST = 'newest',
  MOST_POPULAR = 'most_popular',
  FEATURED_FIRST = 'featured_first',
  PRICE_LOW_HIGH = 'price_low_high',
  PRICE_HIGH_LOW = 'price_high_low',
  ENDING_SOON = 'ending_soon',
}

export enum AdminDealsStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export class AdminDealsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by deal name or business name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by business UUID' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by subscription plan name or tier (e.g. platinum, gold, silver, free)',
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    enum: AdminDealsStatusFilter,
    description: 'Filter by deal status (active, inactive, expired)',
  })
  @IsOptional()
  @IsEnum(AdminDealsStatusFilter)
  status?: AdminDealsStatusFilter;

  @ApiPropertyOptional({ description: 'Filter by featured flag (true/false)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Start date filter (ISO format)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO format)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: AdminDealsSortBy,
    default: AdminDealsSortBy.NEWEST,
    description:
      'Sort order: newest, most_popular, featured_first, price_low_high, price_high_low, ending_soon',
  })
  @IsOptional()
  @IsEnum(AdminDealsSortBy)
  sortBy?: AdminDealsSortBy = AdminDealsSortBy.NEWEST;
}

export class AdminBusinessesQueryDto {
  @ApiPropertyOptional({ description: 'Search businesses by name' })
  @IsOptional()
  @IsString()
  search?: string;
}
