import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
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

  @ApiPropertyOptional({ example: 'Welcome to our store!' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ example: 'Check-in Complete!' })
  @IsString()
  @IsOptional()
  successMessage?: string;

  @ApiPropertyOptional({ example: 'We value your privacy.' })
  @IsString()
  @IsOptional()
  privacyMessage?: string;

  @ApiPropertyOptional({ example: '10% Off your next meal' })
  @IsString()
  @IsOptional()
  rewardMessage?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  rewardEnabled?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  rewardVisitThreshold?: number;

  @ApiPropertyOptional({ example: 'https://logo.url/img.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
