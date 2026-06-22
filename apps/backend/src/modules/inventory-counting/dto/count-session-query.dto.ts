import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CountSessionStatus } from '../entities/stock-count-session.entity';

export class CountSessionQueryDto {
  @ApiPropertyOptional({ enum: CountSessionStatus })
  @IsOptional()
  @IsEnum(CountSessionStatus)
  status?: CountSessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
