import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransferDto {
  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Internal Transfer' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Operating → Reserve' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'XFR-2026-001' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class ListTransfersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number = 20;
}
