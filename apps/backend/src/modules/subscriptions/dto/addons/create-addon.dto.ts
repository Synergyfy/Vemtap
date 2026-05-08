import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
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

class ServiceDetailsDto {
  @ApiPropertyOptional({
    description: 'Type of service agent',
    example: 'dashboard_manager',
  })
  @IsString()
  @IsOptional()
  agentType?: string;

  @ApiPropertyOptional({
    description: 'Description of the service',
    example: 'Dedicated agent to help manage your dashboard operations',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of deliverables included in this service',
    example: ['Weekly report', 'Dashboard optimization', '24/7 support'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliverables?: string[];
}

export class CreateAddonDto {
  @ApiProperty({
    description: 'Name of the add-on',
    example: '3 Extra Branches',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the add-on',
    example: 'Adds 3 additional branch slots to your current plan, allowing you to expand your business operations.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of add-on: RESOURCE for extra limits, SERVICE for custom support',
    enum: AddOnType,
    example: AddOnType.RESOURCE,
  })
  @IsEnum(AddOnType)
  type: AddOnType;

  @ApiProperty({
    description: 'Price of the add-on',
    example: 15000,
  })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiPropertyOptional({
    description: 'Duration in days that the add-on remains valid',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Currency code (default: NGN)',
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
    description:
      'The capability this add-on extends (only for RESOURCE type)',
    example: 'branches',
  })
  @IsString()
  @IsOptional()
  targetCapability?: string;

  @ApiPropertyOptional({
    description:
      'Number of additional units this add-on provides (only for RESOURCE type)',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  additionalLimit?: number;

  @ApiPropertyOptional({
    description: 'Service details for SERVICE type add-ons',
    type: ServiceDetailsDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceDetailsDto)
  serviceDetails?: ServiceDetailsDto;

  @ApiPropertyOptional({
    description:
      'If true, this add-on is a one-time purchase and permanent (only for RESOURCE type)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isOneTime?: boolean;

  @ApiPropertyOptional({
    description:
      'If true, this add-on auto-renews each billing cycle (only for SERVICE type)',
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