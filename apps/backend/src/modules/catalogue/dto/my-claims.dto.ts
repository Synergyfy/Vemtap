import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CatalogueOfferPricingType } from '../entities/catalogue-offer.entity';

/**
 * Customer-facing claim status. Mirrors the persisted claim lifecycle:
 * - `ACTIVE`  → persisted as `claimed` and not yet past `expiresAt`
 * - `REDEEMED` → persisted as `redeemed`
 * - `EXPIRED` → persisted as `expired`, or `claimed` past `expiresAt`
 */
export enum MyClaimStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

export class MyClaimsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description:
      'Opt-in pagination. Omit (with `limit`) to receive the legacy bare array.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 50,
    description:
      'Opt-in pagination. Omit (with `page`) to receive the legacy bare array.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    enum: MyClaimStatus,
    description:
      'Filter by effective claim status. `ACTIVE` excludes claims past `expiresAt`.',
  })
  @IsOptional()
  @IsEnum(MyClaimStatus)
  status?: MyClaimStatus;
}

export class MyClaimOfferDto {
  @ApiProperty({ example: 'uuid-of-offer' })
  id: string;

  @ApiProperty({ example: 'Burger + Wings Combo' })
  name: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  mainImage: string | null;

  @ApiProperty({ example: 11600, description: 'Deal price of the offer' })
  calculatedPrice: number;

  @ApiProperty({
    example: 14500,
    description: 'Sum of the offer item prices before the deal discount',
  })
  originalPrice: number;

  @ApiProperty({ example: 20, description: 'Effective discount percentage' })
  discountPercent: number;

  @ApiProperty({
    enum: CatalogueOfferPricingType,
    example: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
  })
  pricingType: CatalogueOfferPricingType;

  @ApiProperty({ example: 20, nullable: true })
  discountValue: number | null;

  @ApiProperty({ example: 'uuid-of-business' })
  businessId: string;

  @ApiProperty({ example: 'Patrick Ventures' })
  businessName: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  businessLogo: string | null;

  @ApiProperty({ example: 'uuid-of-branch' })
  branchId: string;

  @ApiProperty({ example: 'Main Branch' })
  branchName: string;

  @ApiProperty({
    example: '1 Adetokunbo Ademola Crescent, Wuse 2',
    nullable: true,
  })
  branchAddress: string | null;

  @ApiProperty({
    example: '2026-11-07T10:00:00.000Z',
    nullable: true,
    description: 'Promotion end date (distinct from the claim expiry date)',
  })
  endDate: Date | null;
}

export class MyClaimDto {
  @ApiProperty({ example: 'uuid-of-claim' })
  id: string;

  @ApiProperty({ example: 'VEM1-8GUF52339-A2B3' })
  claimCode: string;

  @ApiProperty({ enum: MyClaimStatus, example: MyClaimStatus.ACTIVE })
  status: MyClaimStatus;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: '2026-10-08T10:00:00.000Z' })
  claimedAt: Date;

  @ApiProperty({
    example: '2026-10-09T12:30:00.000Z',
    nullable: true,
    description:
      'When the merchant redeemed the claim, null while not redeemed',
  })
  redeemedAt: Date | null;

  @ApiProperty({ type: MyClaimOfferDto })
  offer: MyClaimOfferDto;
}

export class MyClaimsPageDto {
  @ApiProperty({ type: [MyClaimDto] })
  data: MyClaimDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

/**
 * Business-side claims list. Pagination is opt-in: without `page`/`limit` the
 * endpoint keeps returning the legacy bare array (old clients depend on it);
 * supplying either returns `{ data, total, page, limit }`.
 */
export class BusinessClaimsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
