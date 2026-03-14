import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormFieldType } from '../entities/form-field.entity';

export class CreateFormFieldDto {
  @ApiProperty({ enum: FormFieldType, default: FormFieldType.TEXT })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiProperty()
  @IsString()
  question: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateFormDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Show form after lead capture' })
  @IsOptional()
  @IsBoolean()
  showAfterLeadCapture?: boolean;

  @ApiPropertyOptional({
    description: 'Specific branch ID if mapped to one branch',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ type: [CreateFormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields: CreateFormFieldDto[];
}
