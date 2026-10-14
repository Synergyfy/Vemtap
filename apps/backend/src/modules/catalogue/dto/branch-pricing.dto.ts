import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CatalogueItemPricingMode } from '../entities/catalogue-item.entity';

export class ItemBranchPricingEntryDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    example: true,
    description:
      'Whether this branch carries the item. false removes it from the branch.',
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({
    example: 14500,
    nullable: true,
    description:
      'Branch price; null/omitted uses the item price. Ignored when pricingMode is uniform.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: 16000, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @ApiPropertyOptional({ example: 24, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number | null;
}

/**
 * Replaces the item's branch availability and prices in one call. Branches
 * left out of `branches` are not touched.
 */
export class SetItemBranchPricingDto {
  @ApiProperty({ enum: CatalogueItemPricingMode, example: 'per_branch' })
  @IsEnum(CatalogueItemPricingMode)
  pricingMode: CatalogueItemPricingMode;

  @ApiProperty({ type: [ItemBranchPricingEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemBranchPricingEntryDto)
  branches: ItemBranchPricingEntryDto[];
}

export class OfferBranchPricingEntryDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    example: true,
    description:
      'false pauses the deal at this branch (its row and claims are kept). ' +
      'true at a branch not yet in the deal adds it.',
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    example: 9600,
    description: 'Deal price for fixed-price / combo deals',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'Discount for percentage / amount deals',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Vouchers available at this branch',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

export class SetOfferBranchPricingDto {
  @ApiProperty({ type: [OfferBranchPricingEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferBranchPricingEntryDto)
  branches: OfferBranchPricingEntryDto[];
}
