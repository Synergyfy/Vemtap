import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProductReviewStatus } from '../entities/product-review.entity';

export class CreateProductReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({
    description:
      'Reviewer display name. Falls back to the authenticated user name when logged in.',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateProductReviewStatusDto {
  @ApiProperty({ enum: ProductReviewStatus })
  @IsEnum(ProductReviewStatus)
  status: ProductReviewStatus;
}

export class ProductReviewsAdminQueryDto {
  @ApiPropertyOptional({ enum: ProductReviewStatus })
  @IsOptional()
  @IsEnum(ProductReviewStatus)
  status?: ProductReviewStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
