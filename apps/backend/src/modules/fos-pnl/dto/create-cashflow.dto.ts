import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashFlowType } from '../../fos-core/entities/cash-flow.entity';

export class CreateCashFlowDto {
  @ApiProperty({ enum: CashFlowType })
  @IsEnum(CashFlowType)
  type: CashFlowType;

  @ApiProperty({ example: 'Revenue Payment' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
