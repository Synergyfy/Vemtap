import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
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

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Street, City', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'branch@example.com', required: false })
  @IsEmail()
  @IsOptional()
  officialEmail?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Updated Branch Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '456 New Ave, City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '+1987654321' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Welcome to our branch!' })
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

  @ApiPropertyOptional({ example: '10% Off your next visit' })
  @IsString()
  @IsOptional()
  rewardMessage?: string;

  @ApiPropertyOptional({ example: 'About our branch...' })
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
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  officialEmail?: string;

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
