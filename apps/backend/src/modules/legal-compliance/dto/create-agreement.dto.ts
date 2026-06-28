import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateAgreementDto {
  @ApiProperty({ example: 'Terms of Service' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'terms-of-service' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'v1.0' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ example: 'https://docs.example.com/terms-v1.pdf' })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAgreementDto {
  @ApiPropertyOptional({ example: 'Terms of Service v2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'v2.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'https://docs.example.com/terms-v2.pdf' })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
