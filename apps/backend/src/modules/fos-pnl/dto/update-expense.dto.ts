import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseFrequency } from '../../fos-core/entities/expense.entity';

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'Salaries' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: ExpenseFrequency })
  @IsOptional()
  @IsEnum(ExpenseFrequency)
  frequency?: ExpenseFrequency;
}
