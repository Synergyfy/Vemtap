import { IsString, IsBoolean, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChatAutomationDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  welcomeEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Welcome message cannot be empty when enabled' })
  welcomeMessage?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  offHoursEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Off-hours message cannot be empty when enabled' })
  offHoursMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  offHoursSchedule?: string;
  
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class AddFaqKeywordDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  keywords: string[];

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Response message cannot be empty' })
  response: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdateFaqKeywordDto {
  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Response message cannot be empty' })
  response?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
