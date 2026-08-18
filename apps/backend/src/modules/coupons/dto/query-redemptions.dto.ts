import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryRedemptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by coupon ID',
  })
  @IsString()
  @IsOptional()
  couponId?: string;

  @ApiPropertyOptional({
    description: 'Filter by promotion code ID',
  })
  @IsString()
  @IsOptional()
  promotionCodeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by business ID',
  })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Filter by plan ID',
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Search by payment reference or promo code',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
