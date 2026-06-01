import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Sleek Table Tent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A modern design perfect for cafes and restaurants', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Restaurant' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'uuid', required: false, description: 'FK to marketing_categories' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'table_tent' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Full HTML/CSS layout configuration JSON structure' })
  @IsObject()
  @IsNotEmpty()
  layoutConfig: any;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'https://cdn.vemtap.com/templates/table-tent.png', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'QR code configuration overrides (styles, margins, custom dots)', required: false })
  @IsObject()
  @IsOptional()
  qrCodeConfig?: any;
}
