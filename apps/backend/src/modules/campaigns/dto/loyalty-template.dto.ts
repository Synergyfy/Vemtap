import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { LoyaltyTemplateStatus } from '../entities/loyalty-template.entity';

export class CreateLoyaltyTemplateDto {
  @ApiProperty({ example: 'Cafe Welcome Boost' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Great for cafés...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: LoyaltyTemplateStatus, default: LoyaltyTemplateStatus.DRAFT })
  @IsEnum(LoyaltyTemplateStatus)
  @IsOptional()
  status?: LoyaltyTemplateStatus;

  @ApiProperty({ description: 'Loyalty rules JSON object' })
  @IsObject()
  @IsOptional()
  rules?: any;

  @ApiProperty({ description: 'Rewards JSON array' })
  @IsArray()
  @IsOptional()
  rewards?: any[];
}

export class UpdateLoyaltyTemplateDto extends PartialType(CreateLoyaltyTemplateDto) {}
