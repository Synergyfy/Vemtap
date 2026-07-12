import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsBoolean, IsInt, Min, MinLength } from 'class-validator';
import { CategoryTypeStatus } from '../entities/offer-category-type.entity';

export class CreateCategoryTypeDto {
  @ApiProperty({ example: 'Discounts' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Percentage or flat amount off purchase.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CategoryTypeStatus, default: CategoryTypeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CategoryTypeStatus)
  status?: CategoryTypeStatus;
}

export class UpdateCategoryTypeDto {
  @ApiPropertyOptional({ example: 'Discounts' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Percentage or flat amount off purchase.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CategoryTypeStatus })
  @IsOptional()
  @IsEnum(CategoryTypeStatus)
  status?: CategoryTypeStatus;
}

export class GenerateReportDto {
  @ApiProperty({ example: 'Monthly Network Performance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Full Summary' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'Last 30 Days' })
  @IsOptional()
  @IsString()
  dateRange?: string;
}

export class UpdateDiscoveryAdminSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableNetwork?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableSponsored?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enablePartnerships?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxOffersPerVisit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxOffersPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultRadius?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxRadius?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  attributionWindow?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;
}
