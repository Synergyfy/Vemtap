import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ICON_NAMES = ['Sparkles', 'Megaphone', 'Zap', 'Gift'] as const;
const GRADIENT_PATTERN = /^bg-gradient-to-[a-z]+/;

export class CreateBannerDto {
  @ApiProperty({ example: 'Welcome to VemTap!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Manage your visitors and loyalty programs.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Megaphone', enum: ICON_NAMES })
  @IsString()
  @IsIn(ICON_NAMES)
  iconName: string;

  @ApiPropertyOptional({ example: 'Learn More' })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiPropertyOptional({ example: '/dashboard/visitors/all' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ example: 'bg-gradient-to-r from-emerald-600 to-teal-500' })
  @IsString()
  color: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
