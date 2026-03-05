import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FormAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @ApiPropertyOptional({
    description:
      'The answer value, could be null if not required and no answer provided',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class SubmitFormResponseDto {
  @ApiPropertyOptional({
    description: 'Branch ID where the response was submitted from',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ type: [FormAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormAnswerDto)
  answers: FormAnswerDto[];
}
