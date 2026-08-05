import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IncidentSeverity, IncidentStatus } from '../entities/incident.entity';
import { SystemComponentStatus } from '../entities/status-component.entity';

export class CreateSystemComponentDto {
  @ApiProperty({
    description: 'URL-friendly unique slug, e.g. nfc-response-api',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: SystemComponentStatus })
  @IsOptional()
  @IsEnum(SystemComponentStatus)
  status?: SystemComponentStatus;

  @ApiPropertyOptional({ description: 'Current latency in ms' })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional({ description: '90-day uptime percentage string' })
  @IsOptional()
  @IsString()
  uptime90d?: string;

  @ApiPropertyOptional({ description: 'Sort order (ascending)' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSystemComponentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: SystemComponentStatus })
  @IsOptional()
  @IsEnum(SystemComponentStatus)
  status?: SystemComponentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uptime90d?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateIncidentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Affected component slug' })
  @IsOptional()
  @IsString()
  componentSlug?: string;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ description: 'ISO timestamp. Defaults to now.' })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp when resolved' })
  @IsOptional()
  @IsString()
  resolvedAt?: string;
}

export class UpdateIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  componentSlug?: string;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolvedAt?: string;
}
