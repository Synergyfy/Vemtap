import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class MySavingsQueryDto {
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
    description: 'Only include redemptions from the past N days',
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}

export class MySavingsEntryDto {
  @ApiProperty({ example: 'uuid-of-claim' })
  id: string;

  @ApiProperty({
    example: '2026-10-08T19:27:00.000Z',
    description: 'When the merchant redeemed the claim',
  })
  redeemedAt: Date;

  @ApiProperty({ example: 'Patrick Ventures' })
  merchantName: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  merchantImageUrl: string | null;

  @ApiProperty({ example: 'Apo Lunch Combo' })
  offerName: string;

  @ApiProperty({ example: 'VEM4-1YVXBYLZA-S2DT' })
  claimCode: string;

  @ApiProperty({
    example: 10000,
    description: 'Sum of the offer item prices (before the deal discount)',
  })
  originalAmount: number;

  @ApiProperty({ example: 8500, description: 'Deal price actually paid' })
  paidAmount: number;

  @ApiProperty({ example: 1500 })
  savedAmount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ nullable: true, example: 'uuid-of-category' })
  categoryId: string | null;

  @ApiProperty({ example: 'Food & Beverage', nullable: true })
  categoryName: string | null;
}

export class MySavingsPageDto {
  @ApiProperty({ type: [MySavingsEntryDto] })
  data: MySavingsEntryDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({
    example: 8500,
    description: 'Total naira saved across all matching redemptions',
  })
  totalSavedAmount: number;
}

export class SavingsCategoryDto {
  @ApiProperty({ nullable: true, example: 'uuid-of-category' })
  id: string | null;

  @ApiProperty({ example: 'Food & Beverage' })
  name: string;

  @ApiProperty({ example: 4 })
  redemptions: number;

  @ApiProperty({ example: 6200 })
  savedAmount: number;

  @ApiProperty({
    example: 62.5,
    description: 'Share of total savings (0–100)',
  })
  sharePercent: number;
}

export class SavingsBreakdownDto {
  @ApiProperty({ type: [SavingsCategoryDto] })
  data: SavingsCategoryDto[];

  @ApiProperty({ example: 8500 })
  totalSavedAmount: number;

  @ApiProperty({ example: 6 })
  totalRedemptions: number;
}

export class SavingsCategoriesQueryDto {
  @ApiPropertyOptional({
    description: 'Only include redemptions from the past N days',
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}

export class SavingsExportQueryDto {
  @ApiPropertyOptional({
    enum: ['csv'],
    default: 'csv',
    description: 'Export format (only csv is supported)',
  })
  @IsOptional()
  @IsIn(['csv'])
  format?: 'csv' = 'csv';

  @ApiPropertyOptional({
    description: 'Only include redemptions from the past N days',
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
