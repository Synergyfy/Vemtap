import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DealReviewStatus } from '../entities/deal-review.entity';

export class CreateDealReviewDto {
  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  comment: string;

  @ApiPropertyOptional({
    description:
      'Reviewer display name. Falls back to the authenticated user name when logged in; required for anonymous reviewers.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({
    description: 'Rating score from 1 to 5 (optional)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ListReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class ReviewsAdminQueryDto {
  @ApiPropertyOptional({ enum: DealReviewStatus })
  @IsOptional()
  @IsEnum(DealReviewStatus)
  status?: DealReviewStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class BusinessReviewsQueryDto {
  @ApiPropertyOptional({
    enum: DealReviewStatus,
    description: 'Filter reviews by moderation status',
  })
  @IsOptional()
  @IsEnum(DealReviewStatus)
  status?: DealReviewStatus;

  @ApiPropertyOptional({
    description: 'Filter reviews by specific offer UUID',
  })
  @IsOptional()
  @IsString()
  offerId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
