import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
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
}
