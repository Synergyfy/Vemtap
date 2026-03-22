import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminFormQueryDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by business ID' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Search by form title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}
