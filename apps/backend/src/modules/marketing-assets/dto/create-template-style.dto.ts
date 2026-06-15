import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateTemplateStyleDto {
  @ApiProperty({ example: 'Classic' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'classic', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Simple & Professional', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsString()
  @IsNotEmpty()
  bgColor: string;

  @ApiProperty({ example: '#1E293B' })
  @IsString()
  @IsNotEmpty()
  accentColor: string;

  @ApiProperty({ example: '#CBD5E1' })
  @IsString()
  @IsNotEmpty()
  borderColor: string;

  @ApiProperty({ example: '#0F172A' })
  @IsString()
  @IsNotEmpty()
  qrFgColor: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsString()
  @IsNotEmpty()
  qrBgColor: string;

  @ApiProperty({ example: '#0F172A' })
  @IsString()
  @IsNotEmpty()
  textColor: string;

  @ApiProperty({ example: { fontFamily: 'Inter', headingSize: 32 }, required: false })
  @IsObject()
  @IsOptional()
  fontConfig?: Record<string, any>;

  @ApiProperty({ example: { padding: 16 }, required: false })
  @IsObject()
  @IsOptional()
  layoutConfig?: Record<string, any>;

  @ApiProperty({ example: { borderRadius: 8 }, required: false })
  @IsObject()
  @IsOptional()
  ctaConfig?: Record<string, any>;

  @ApiProperty({ example: { cornerStyle: 'rounded' }, required: false })
  @IsObject()
  @IsOptional()
  qrConfig?: Record<string, any>;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
