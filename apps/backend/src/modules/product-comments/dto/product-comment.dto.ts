import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateProductCommentDto {
  @ApiProperty({ description: 'Comment text (1–1000 characters)' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 5,
    description: 'Optional stars',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class UpdateProductCommentDto {
  @ApiPropertyOptional({ description: 'Comment text (1–1000 characters)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ProductCommentsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export const COMMENT_REPLY_FILTERS = ['all', 'unreplied', 'replied'] as const;
export type CommentReplyFilter = (typeof COMMENT_REPLY_FILTERS)[number];

export class BusinessProductCommentsQueryDto extends ProductCommentsQueryDto {
  @ApiPropertyOptional({ description: 'Only comments on this item' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ enum: COMMENT_REPLY_FILTERS, default: 'all' })
  @IsOptional()
  @IsIn(COMMENT_REPLY_FILTERS)
  replied?: CommentReplyFilter;
}

export class ReplyToProductCommentDto {
  @ApiProperty({ description: 'Public reply (1–1000 characters)' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reply: string;
}
