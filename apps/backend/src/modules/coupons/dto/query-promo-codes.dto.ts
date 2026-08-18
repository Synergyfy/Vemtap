import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class QueryPromoCodesDto {
  @ApiPropertyOptional({
    description: 'Filter by parent coupon ID',
  })
  @IsString()
  @IsOptional()
  couponId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status (true/false)',
  })
  @IsBooleanString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({
    description: 'Search by promo code text substring',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
