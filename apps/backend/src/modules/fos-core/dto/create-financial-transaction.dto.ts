import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FosTransactionType,
  FosPlatform,
} from '../entities/financial-transaction.entity';

export class CreateFinancialTransactionDto {
  @ApiProperty({ enum: FosTransactionType })
  @IsEnum(FosTransactionType)
  @IsNotEmpty()
  type: FosTransactionType;

  @ApiProperty({ enum: FosPlatform })
  @IsEnum(FosPlatform)
  @IsNotEmpty()
  platform: FosPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class DateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
