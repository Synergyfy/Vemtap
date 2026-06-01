import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class SaveBrandOverrideDto {
  @ApiProperty({ example: 'https://cdn.vemtap.com/brands/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: '#2563EB', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ example: '#1E293B', required: false })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({ example: '#F59E0B', required: false })
  @IsString()
  @IsOptional()
  accentColor?: string;

  @ApiProperty({ example: 'Best Coffee in Town!', required: false })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'contact@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  socialLinks?: any;
}
