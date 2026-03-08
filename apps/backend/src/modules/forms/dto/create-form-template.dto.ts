import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormFieldType } from '../entities/form-field.entity';

export class CreateFormFieldTemplateDto {
  @ApiProperty({ enum: FormFieldType, example: FormFieldType.TEXT })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiProperty({ example: 'What is your name?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: ['Option 1', 'Option 2'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateFormTemplateDto {
  @ApiProperty({ example: 'Customer Satisfaction Template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'A template for gathering customer feedback.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateFormFieldTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldTemplateDto)
  fields: CreateFormFieldTemplateDto[];
}
