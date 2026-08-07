import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FosInvoiceStatus, FosLedgerSource } from '../entities/invoice.entity';
import { FosBillStatus } from '../entities/bill.entity';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'Zenith Logistics' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-07-23' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ enum: FosInvoiceStatus })
  @IsOptional()
  @IsEnum(FosInvoiceStatus)
  status?: FosInvoiceStatus;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 'Zenith Logistics' })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-07-23' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: FosInvoiceStatus })
  @IsOptional()
  @IsEnum(FosInvoiceStatus)
  status?: FosInvoiceStatus;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}

export class CreateBillDto {
  @ApiProperty({ example: 'Termii SMS Gateway' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 420000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Gateway' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: FosBillStatus })
  @IsOptional()
  @IsEnum(FosBillStatus)
  status?: FosBillStatus;
}

export class UpdateBillDto {
  @ApiPropertyOptional({ example: 'Termii SMS Gateway' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 420000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Gateway' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: FosBillStatus })
  @IsOptional()
  @IsEnum(FosBillStatus)
  status?: FosBillStatus;
}

export { FosLedgerSource };
