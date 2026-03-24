import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  MinLength,
  IsObject,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DayScheduleDto {
  @ApiProperty({ description: 'Start time in HH:mm format' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format' })
  @IsString()
  endTime: string;
}

export class CustomScheduleDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/DayScheduleDto' },
  })
  @IsObject()
  @IsOptional()
  days?: Record<string, DayScheduleDto>; // e.g., { "monday": { startTime: "09:00", endTime: "17:00" } }

  @ApiProperty()
  @IsString()
  @IsOptional()
  timezone?: string;
}

export class UpdateChatAutomationDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  welcomeEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  offHoursEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  offHoursMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  offHoursSchedule?: string; // 'Outside Business Hours' | 'Always On (Away Mode)' | 'Custom Schedule'

  @ApiProperty({ required: false, type: CustomScheduleDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomScheduleDto)
  customSchedule?: CustomScheduleDto;

  @IsUUID()
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

  @IsUUID()
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
