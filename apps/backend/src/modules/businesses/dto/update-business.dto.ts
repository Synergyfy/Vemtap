import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { BusinessType } from '../entities/business.entity';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'The Azure Bistro' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: BusinessType, example: BusinessType.RESTAURANT })
  @IsEnum(BusinessType)
  @IsOptional()
  type?: BusinessType;

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
}
