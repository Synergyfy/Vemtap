import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SurveyTriggerType,
  SurveyQuestion,
  TargetAudience,
} from '../entities/survey.entity';

export class SurveyQuestionDto implements SurveyQuestion {
  @ApiProperty({ example: 'q1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'How was your experience?' })
  @IsString()
  text: string;

  @ApiProperty({ enum: ['rating', 'choice', 'text'], example: 'rating' })
  @IsEnum(['rating', 'choice', 'text'])
  type: 'rating' | 'choice' | 'text';

  @ApiProperty({ example: ['Option 1', 'Option 2'], required: false })
  @IsArray()
  @IsOptional()
  options?: string[];
}

export class TargetAudienceDto implements TargetAudience {
  @ApiProperty({ example: true })
  @IsBoolean()
  new: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  returning: boolean;
}

export class CreateSurveyDto {
  @ApiProperty({ type: [SurveyQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions: SurveyQuestionDto[];

  @ApiProperty({ enum: SurveyTriggerType, example: SurveyTriggerType.INSTANT })
  @IsEnum(SurveyTriggerType)
  triggerType: SurveyTriggerType;

  @ApiProperty({ example: 0, description: 'Delay in minutes', required: false })
  @IsNumber()
  @IsOptional()
  triggerDelay?: number;

  @ApiProperty({ type: TargetAudienceDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience: TargetAudienceDto;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
