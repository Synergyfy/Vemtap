import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum VisitorStatus {
  NEW = 'new',
  RETURNING = 'returning',
  VIP = 'vip',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class VisitorQueryDto {
  @ApiProperty({
    required: false,
    description: 'Search by name, email or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: VisitorStatus,
    default: VisitorStatus.ALL,
  })
  @IsOptional()
  @IsEnum(VisitorStatus)
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}
