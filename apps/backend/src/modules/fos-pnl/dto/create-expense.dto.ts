import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseFrequency } from '../../fos-core/entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Salaries' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ExpenseFrequency })
  @IsEnum(ExpenseFrequency)
  frequency: ExpenseFrequency;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
