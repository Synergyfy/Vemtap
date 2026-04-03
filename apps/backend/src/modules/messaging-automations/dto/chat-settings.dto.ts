import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateChatSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  offHoursEnabled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offHoursMessage?: string;

  @ApiPropertyOptional({ example: 'Outside Business Hours' })
  @IsString()
  @IsOptional()
  offHoursSchedule?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  customSchedule?: any;
}
