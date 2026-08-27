import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TargetAudience } from '../entities/notification-broadcast.entity';

export class AdminBroadcastDto {
  @ApiProperty({
    example: 'System Maintenance Notice',
    description: 'Title of the notification',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Our systems will undergo brief maintenance tonight at 2 AM.',
    description: 'Notification body message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    enum: TargetAudience,
    example: TargetAudience.ALL,
    description: 'Target audience for the broadcast (ALL, BUSINESSES, CUSTOMERS, AGENTS)',
  })
  @IsEnum(TargetAudience)
  @IsNotEmpty()
  targetAudience: TargetAudience;

  @ApiPropertyOptional({
    example: 'announcement',
    description: 'Type of notification: announcement, info, warning, success, error',
    default: 'announcement',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '/dashboard/updates',
    description: 'Optional deep link or URL redirect when tapped',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to send Web Push notification to users with registered push tokens',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendPush?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to create in-app notification inbox records',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendInApp?: boolean;
}

export class BroadcastQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: TargetAudience,
    description: 'Filter by target audience',
  })
  @IsOptional()
  @IsEnum(TargetAudience)
  targetAudience?: TargetAudience;

  @ApiPropertyOptional({
    example: 'Maintenance',
    description: 'Search by title or message keyword',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
