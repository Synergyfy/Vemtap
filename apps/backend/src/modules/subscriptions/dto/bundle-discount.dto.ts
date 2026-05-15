import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBundleDiscountDto {
  @ApiProperty({ example: 'Small Bundle' })
  @IsString()
  label: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  minQuantity: number;

  @ApiPropertyOptional({ example: 6 })
  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  discountPercent: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBundleDiscountDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
