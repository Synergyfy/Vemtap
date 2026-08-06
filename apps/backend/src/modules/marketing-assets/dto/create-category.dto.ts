import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateMarketingCategoryDto {
  @ApiProperty({ example: 'Restaurant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'restaurant',
    required: false,
    description: 'Auto-generated from name if omitted',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Templates for restaurants and cafes',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'UtensilsCrossed', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: '#2563EB', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
