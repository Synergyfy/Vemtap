import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'The Azure Bistro' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ example: 'Art Studio' })
  @IsOptional()
  @IsString()
  otherSubcategoryName?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: ['https://example.com/doc.pdf'] })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
