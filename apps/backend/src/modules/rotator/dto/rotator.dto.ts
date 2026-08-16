import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsString,
  Matches,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RotatorMode,
  RotatorDistribution,
  FeaturedSlotsMode,
  DeliveryOverride,
} from '../entities/rotator-config.entity';

export class UpdateRotatorGlobalConfigDto {
  @ApiPropertyOptional({ enum: RotatorMode, example: RotatorMode.AUTOMATIC })
  @IsOptional()
  @IsEnum(RotatorMode)
  rotationMode?: RotatorMode;

  @ApiPropertyOptional({
    enum: RotatorDistribution,
    example: RotatorDistribution.BALANCED,
  })
  @IsOptional()
  @IsEnum(RotatorDistribution)
  distribution?: RotatorDistribution;

  @ApiPropertyOptional({
    enum: FeaturedSlotsMode,
    example: FeaturedSlotsMode.AUTOMATIC,
  })
  @IsOptional()
  @IsEnum(FeaturedSlotsMode)
  featuredSlotsMode?: FeaturedSlotsMode;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  featuredSlotCount?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Internal rotation window in seconds (platform-controlled).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(3600)
  windowSeconds?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  frequencyWindowHours?: number;
}

export class UpdateRotatorClusterConfigDto {
  @ApiPropertyOptional({ enum: RotatorMode })
  @IsOptional()
  @IsEnum(RotatorMode)
  rotationMode?: RotatorMode;

  @ApiPropertyOptional({ enum: RotatorDistribution })
  @IsOptional()
  @IsEnum(RotatorDistribution)
  distribution?: RotatorDistribution;

  @ApiPropertyOptional({ enum: FeaturedSlotsMode })
  @IsOptional()
  @IsEnum(FeaturedSlotsMode)
  featuredSlotsMode?: FeaturedSlotsMode;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  featuredSlotCount?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Reset this cluster back to automatic (inherits global defaults).',
  })
  @IsOptional()
  @IsBoolean()
  reset?: boolean;
}

export class SetClusterOfferIncludedDto {
  @ApiProperty({
    example: true,
    description: 'Include (true) or exclude (false) in manual mode',
  })
  @IsBoolean()
  included: boolean;
}

export class SetClusterOfferDeliveryDto {
  @ApiProperty({ enum: DeliveryOverride, example: DeliveryOverride.MANUAL })
  @IsEnum(DeliveryOverride)
  deliveryOverride: DeliveryOverride;

  @ApiPropertyOptional({
    example: 3,
    description: 'Delivery weight (1–5) when manual',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  weight?: number;
}

export class PreviewRotationDto {
  @ApiPropertyOptional({
    example: 3,
    default: 3,
    description: 'Number of windows to preview',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  windows?: number;
}

export class RotatorAnalyticsQueryDto {
  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'Number of days of history to aggregate',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class RotatorWindowHistoryQueryDto {
  @ApiPropertyOptional({
    example: 50,
    default: 50,
    description: 'Maximum number of rotation windows to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export enum ClusterEventType {
  VIEW = 'view',
  CLICK = 'click',
}

export class RecordClusterEventDto {
  @ApiProperty({
    enum: ClusterEventType,
    example: ClusterEventType.VIEW,
    description:
      'Only view/click are accepted here; impressions are automatic.',
  })
  @IsEnum(ClusterEventType)
  type: ClusterEventType;

  @ApiProperty({
    example: 'uuid-of-deal',
    description: 'The deal (catalogue offer) the customer viewed or clicked',
  })
  @IsUUID()
  offerId: string;

  @ApiPropertyOptional({
    example: 1786724369,
    description:
      'Optional rotation window id. When omitted it is resolved from the current window.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  windowId?: number;
}

export class UpsertDealScheduleDto {
  @ApiPropertyOptional({
    example: 'uuid-of-schedule',
    description: 'Existing schedule id to update',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    example: 1,
    description: '0=Sun … 6=Sat; omit/null = every day',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: '11:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be HH:mm (24h)',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be HH:mm (24h)',
  })
  endTime?: string;

  @ApiPropertyOptional({ example: '2026-08-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-20T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
