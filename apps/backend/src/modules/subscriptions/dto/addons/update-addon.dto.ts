import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddOnType } from '../../entities/addon.entity';
import { CreateAddonDto } from './create-addon.dto';

export class UpdateAddonDto extends PartialType(CreateAddonDto) {
  @ApiPropertyOptional({
    description: 'Name of the add-on',
    example: '5 Extra Branches',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the add-on',
    example: 'Adds 5 additional branch slots to your current plan.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of add-on',
    enum: AddOnType,
    example: AddOnType.RESOURCE,
  })
  @IsEnum(AddOnType)
  @IsOptional()
  type?: AddOnType;

  @ApiPropertyOptional({
    description: 'Price of the add-on',
    example: 25000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Duration in days that the add-on remains valid',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'NGN',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Whether this add-on is active and purchasable',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'The capability this add-on extends (RESOURCE type only)',
    example: 'branches',
  })
  @IsString()
  @IsOptional()
  targetCapability?: string;

  @ApiPropertyOptional({
    description:
      'Number of additional units this add-on provides (RESOURCE type only)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  additionalLimit?: number;

  @ApiPropertyOptional({
    description: 'Service details for SERVICE type add-ons',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  serviceDetails?: any;

  @ApiPropertyOptional({
    description: 'One-time purchase flag (RESOURCE type only)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isOneTime?: boolean;

  @ApiPropertyOptional({
    description: 'Recurring flag (SERVICE type only)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'URL to an image representing this add-on',
    example: 'https://cdn.example.com/addons/extra-branches.png',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}