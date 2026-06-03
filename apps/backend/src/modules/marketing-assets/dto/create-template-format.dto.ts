import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateTemplateFormatDto {
  @ApiProperty({ example: 'A4 Poster' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'poster_a4', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 210 })
  @IsNumber()
  @IsNotEmpty()
  widthMm: number;

  @ApiProperty({ example: 297 })
  @IsNumber()
  @IsNotEmpty()
  heightMm: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  bleedMm?: number;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  printMarginMm?: number;

  @ApiProperty({ example: 300, required: false })
  @IsNumber()
  @IsOptional()
  resolution?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
