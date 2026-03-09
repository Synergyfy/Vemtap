import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Retail & Shops', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Businesses that sell physical products directly to customers...',
    description: 'Category description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Retail & Shops' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Supermarket', description: 'Subcategory name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Grocery stores', description: 'Subcategory description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid', description: 'Parent category ID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateSubcategoryDto {
  @ApiPropertyOptional({ example: 'Supermarket' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CategoryPaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class SubcategoryPaginationDto extends CategoryPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
