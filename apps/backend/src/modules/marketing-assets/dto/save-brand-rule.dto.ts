import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsObject } from 'class-validator';

export class SaveBrandRuleDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  logoRequired?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  primaryColorRequired?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  secondaryColorRequired?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  fontFamilyRequired?: boolean;

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
