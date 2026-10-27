import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateCatalogueCategoryDto {
  @ApiProperty({ example: 'Food' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'product', enum: ['product', 'service'] })
  @IsOptional()
  @IsIn(['product', 'service'])
  kind?: 'product' | 'service';

  @ApiPropertyOptional({ example: 'Flame-grilled mains' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'restaurant' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/grills.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCatalogueCategoryDto {
  @ApiPropertyOptional({ example: 'Drinks' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'product', enum: ['product', 'service'] })
  @IsOptional()
  @IsIn(['product', 'service'])
  kind?: 'product' | 'service';

  @ApiPropertyOptional({ example: 'Flame-grilled mains' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'restaurant' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/grills.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class ReorderCatalogueCategoryDto {
  @ApiProperty({
    type: [String],
    description:
      'Every category id of the business in its new display order; index becomes sortOrder.',
    example: ['3f1d2a1e-0000-4000-8000-000000000001'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
