import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsUUID,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClusterType } from '../entities/cluster.entity';

export class AddBranchDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}

export class CreateClusterDto {
  @ApiProperty({ example: 'Banex Market' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    enum: ClusterType,
    example: ClusterType.MARKET,
    default: ClusterType.MARKET,
  })
  @IsOptional()
  @IsEnum(ClusterType)
  type?: ClusterType;

  @ApiPropertyOptional({ example: 'uuid-of-parent-cluster' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({ example: 'FCT' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: 'Abuja' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Banex' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @ApiPropertyOptional({ example: 'Market deals around Banex Plaza' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 9.0489 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 7.4894 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 500, default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radiusMeters?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  qrIsActive?: boolean;
}

export class UpdateClusterDto {
  @ApiPropertyOptional({ example: 'Banex Market' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    enum: ClusterType,
    example: ClusterType.MARKET,
  })
  @IsOptional()
  @IsEnum(ClusterType)
  type?: ClusterType;

  @ApiPropertyOptional({ example: 'uuid-of-parent-cluster' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({ example: 'FCT' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: 'Abuja' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Banex' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @ApiPropertyOptional({ example: 'Market deals around Banex Plaza' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 9.0489 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 7.4894 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radiusMeters?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  qrIsActive?: boolean;
}

export class AdminClusterQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'Banex' })
  @IsOptional()
  @IsString()
  search?: string;
}

export enum AutoAssignScope {
  UNASSIGNED = 'unassigned',
  ALL = 'all',
}

export class AutoAssignClustersDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Preview the assignment without persisting',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    enum: AutoAssignScope,
    example: AutoAssignScope.UNASSIGNED,
    default: AutoAssignScope.UNASSIGNED,
    description:
      "'unassigned' only considers branches without a cluster. " +
      "'all' considers every branch and reassigns it to a different, closer covering cluster when one exists.",
  })
  @IsOptional()
  @IsEnum(AutoAssignScope)
  scope?: AutoAssignScope = AutoAssignScope.UNASSIGNED;

  @ApiPropertyOptional({
    example: false,
    description:
      'When true (and dryRun is false), enqueue the assignment to the background worker and return immediately.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  async?: boolean;
}
