import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomReportDto {
  @ApiPropertyOptional({ enum: ['30days', '90days', '12months'] })
  @IsOptional()
  @IsIn(['30days', '90days', '12months'])
  dateRange?: '30days' | '90days' | '12months';

  @ApiPropertyOptional({ example: 'SaaS' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;
}
