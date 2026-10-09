import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ServicePriceType } from '../../catalogue/entities/catalogue-item.entity';

export enum SavedItemType {
  DEAL = 'DEAL',
  BUSINESS = 'BUSINESS',
  SERVICE = 'SERVICE',
}

export class SavedQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: SavedItemType,
    description: 'Filter the unified saved feed by item type',
  })
  @IsOptional()
  @IsEnum(SavedItemType)
  type?: SavedItemType;
}

export class SaveToggleResponseDto {
  @ApiProperty({
    example: true,
    description: 'True when the item is now saved, false when it was unsaved',
  })
  saved: boolean;
}

export class SaveStatusResponseDto {
  @ApiProperty({ example: true })
  isSaved: boolean;
}

export class SavedDealItemDto {
  @ApiProperty({ example: 'uuid-of-offer' })
  offerId: string;

  @ApiProperty({ example: 'Burger + Wings Combo' })
  name: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  mainImage: string | null;

  @ApiProperty({ example: 'Patrick Ventures' })
  businessName: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  businessLogo: string | null;

  @ApiProperty({ example: 'Main Branch', nullable: true })
  branchName: string | null;

  @ApiProperty({
    example: '1 Adetokunbo Ademola Crescent, Wuse 2',
    nullable: true,
  })
  branchAddress: string | null;

  @ApiProperty({ example: 11600 })
  calculatedPrice: number;

  @ApiProperty({ example: 14500 })
  originalPrice: number;

  @ApiProperty({ example: 20 })
  discountPercent: number;

  @ApiProperty({ example: '2026-11-07T10:00:00.000Z', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: false })
  isExpired: boolean;
}

export class SavedBusinessItemDto {
  @ApiProperty({ example: 'uuid-of-business' })
  id: string;

  @ApiProperty({ example: 'Patrick Ventures' })
  name: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  logoUrl: string | null;

  @ApiProperty({ example: 'Food & Beverage', nullable: true })
  categoryName: string | null;

  @ApiProperty({
    example: '1 Adetokunbo Ademola Crescent, Wuse 2',
    nullable: true,
  })
  address: string | null;

  @ApiProperty({ example: 'Abuja', nullable: true })
  city: string | null;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({
    example: 'QFN2OX8BJ',
    description: 'Business 9-character code for the public profile link',
  })
  slug: string;

  @ApiProperty({
    example: 'BR123XYZ9',
    nullable: true,
    description: 'Main branch code',
  })
  branchCode: string | null;
}

export class SavedServiceItemDto {
  @ApiProperty({ example: 'uuid-of-item' })
  id: string;

  @ApiProperty({ example: 'Private Event Catering' })
  name: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  mainImage: string | null;

  @ApiProperty({ example: 150000 })
  price: number;

  @ApiProperty({ enum: ServicePriceType, example: ServicePriceType.FIXED })
  priceType: ServicePriceType;

  @ApiProperty({ example: 150000, nullable: true })
  priceRangeMin: number | null;

  @ApiProperty({ example: 1500000, nullable: true })
  priceRangeMax: number | null;

  @ApiProperty({ example: '3 hours', nullable: true })
  duration: string | null;

  @ApiProperty({ example: 'uuid-of-business' })
  businessId: string;

  @ApiProperty({ example: 'Patrick Ventures' })
  businessName: string;

  @ApiProperty({ example: 'uuid-of-branch', nullable: true })
  branchId: string | null;

  @ApiProperty({ example: 'Main Branch', nullable: true })
  branchName: string | null;

  @ApiProperty({ example: true })
  isBookable: boolean;
}

export class SavedItemDto {
  @ApiProperty({
    example: 'uuid-of-save-row',
    description: 'Id of the save record (use for list keys)',
  })
  id: string;

  @ApiProperty({ enum: SavedItemType, example: SavedItemType.DEAL })
  type: SavedItemType;

  @ApiProperty({ example: '2026-10-08T10:00:00.000Z' })
  savedAt: Date;

  @ApiProperty({
    oneOf: [
      { $ref: '#/components/schemas/SavedDealItemDto' },
      { $ref: '#/components/schemas/SavedBusinessItemDto' },
      { $ref: '#/components/schemas/SavedServiceItemDto' },
    ],
    description:
      'The saved payload for `type`: a deal card, business card, or service card',
  })
  item: SavedDealItemDto | SavedBusinessItemDto | SavedServiceItemDto;
}

export class SavedPageDto {
  @ApiProperty({ type: [SavedItemDto] })
  data: SavedItemDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

/** Per-store counts behind the saved feed's tab badges. */
export class SavedTotalsDto {
  @ApiProperty({ example: 9, description: 'Sum of every store' })
  all: number;

  @ApiProperty({ example: 4 })
  deals: number;

  @ApiProperty({ example: 3 })
  businesses: number;

  @ApiProperty({ example: 2 })
  services: number;
}

/**
 * The unified feed's response. It carries the per-store breakdown that
 * `SavedPageDto` cannot: only this route reads all three stores, and only it
 * knows each one's count.
 */
export class SavedUnifiedPageDto extends SavedPageDto {
  @ApiPropertyOptional({
    type: SavedTotalsDto,
    description:
      'Per-store counts, free with this response. Omitted when `type` is sent, ' +
      'because a filtered read skips the other stores and cannot count them.',
  })
  totals?: SavedTotalsDto;
}
