import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SegmentType } from '../entities/segment.entity';
import { SegmentCriteriaDto } from './segment-criteria.dto';

export class CreateSegmentDto {
  @ApiProperty({ example: 'VIP Customers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Customers with high visit frequency' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-branch' })
  @IsUUID()
  @IsOptional()
  branchId?: string;
  @ApiPropertyOptional({ enum: SegmentType, default: SegmentType.STATIC })
  @IsOptional()
  @IsEnum(SegmentType)
  type?: SegmentType;

  @ApiPropertyOptional({
    type: SegmentCriteriaDto,
    description: 'Required for dynamic segments',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SegmentCriteriaDto)
  criteria?: SegmentCriteriaDto;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional({ example: 'VIP Gold' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
  @ApiPropertyOptional({ enum: SegmentType, default: SegmentType.STATIC })
  @IsOptional()
  @IsEnum(SegmentType)
  type?: SegmentType;

  @ApiPropertyOptional({
    type: SegmentCriteriaDto,
    description: 'Required for dynamic segments',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SegmentCriteriaDto)
  criteria?: SegmentCriteriaDto;
}

export class SegmentMemberDto {
  @ApiProperty({ example: ['uuid-user-1', 'uuid-user-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
