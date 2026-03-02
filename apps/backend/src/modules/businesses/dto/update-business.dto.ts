import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { BusinessType } from '../entities/business.entity';
import { Type } from 'class-transformer';

export class DayHoursDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  open?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsString()
  @IsOptional()
  close?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  closed?: boolean;
}

export class BusinessHoursDto {
  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  monday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  tuesday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  wednesday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  thursday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  friday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  saturday?: DayHoursDto;

  @ApiPropertyOptional({ type: DayHoursDto })
  @ValidateNested()
  @Type(() => DayHoursDto)
  @IsOptional()
  sunday?: DayHoursDto;
}

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

  @ApiPropertyOptional({ example: 'A luxury dining experience with ocean views.' })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiPropertyOptional({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  @IsOptional()
  businessHours?: BusinessHoursDto;

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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instagramUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tiktokUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  xUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reviewUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showReview?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showSocial?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showFeedback?: boolean;
}
