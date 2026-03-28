import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

export enum VisitorStatus {
  NEW = 'new',
  RETURNING = 'returning',
  VIP = 'vip',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class VisitorQueryDto extends BranchFilterDto {
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
}
