import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum RotatorMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum RotatorDistribution {
  BALANCED = 'balanced',
  WEIGHTED = 'weighted',
  SCHEDULED = 'scheduled',
  SMART = 'smart',
}

export enum FeaturedSlotsMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum DeliveryOverride {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

@Entity('rotator_configs')
export class RotatorConfig extends AbstractBaseEntity {
  @ApiProperty({
    enum: RotatorMode,
    example: RotatorMode.AUTOMATIC,
    description: 'Automatic = include all eligible deals; Manual = admin picks',
    default: RotatorMode.AUTOMATIC,
  })
  @Column({
    type: 'simple-enum',
    enum: RotatorMode,
    default: RotatorMode.AUTOMATIC,
  })
  rotationMode: RotatorMode;

  @ApiProperty({
    enum: RotatorDistribution,
    example: RotatorDistribution.BALANCED,
    description:
      'How deals are distributed over time. smart is reserved for a future AI mode.',
    default: RotatorDistribution.BALANCED,
  })
  @Column({
    type: 'simple-enum',
    enum: RotatorDistribution,
    default: RotatorDistribution.BALANCED,
  })
  distribution: RotatorDistribution;

  @ApiProperty({
    enum: FeaturedSlotsMode,
    example: FeaturedSlotsMode.AUTOMATIC,
    default: FeaturedSlotsMode.AUTOMATIC,
  })
  @Column({
    type: 'simple-enum',
    enum: FeaturedSlotsMode,
    default: FeaturedSlotsMode.AUTOMATIC,
  })
  featuredSlotsMode: FeaturedSlotsMode;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Manual featured slot count (used when featuredSlotsMode=manual)',
  })
  @Column({ type: 'int', nullable: true })
  featuredSlotCount: number | null;

  @ApiPropertyOptional({
    example: 60,
    description:
      'Internal rotation window length in seconds. Controlled by the platform team, not exposed to businesses.',
    default: 60,
  })
  @Column({ type: 'int', default: 60 })
  windowSeconds: number;

  @ApiPropertyOptional({
    example: 24,
    description:
      'Frequency window in hours for exposure analytics. V1 records only; enforcement comes later.',
    default: 24,
  })
  @Column({ type: 'int', default: 24 })
  frequencyWindowHours: number;
}
