import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FosRecordType } from '../entities/record.entity';

export class CreateRecordDto {
  @ApiProperty({ example: '2026-07-18' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: FosRecordType })
  @IsEnum(FosRecordType)
  type: FosRecordType;

  @ApiProperty({ example: 'Service Revenue' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Consulting' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class ListRecordsQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number;

  @ApiPropertyOptional({ enum: FosRecordType })
  @IsOptional()
  @IsEnum(FosRecordType)
  type?: FosRecordType;

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
