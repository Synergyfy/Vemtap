import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Cluster } from '../../clusters/entities/cluster.entity';
import {
  RotatorMode,
  RotatorDistribution,
  FeaturedSlotsMode,
} from './rotator-config.entity';

@Entity('rotator_cluster_configs')
@Index('idx_rotator_cluster_config_cluster', ['clusterId'], { unique: true })
export class RotatorClusterConfig extends AbstractBaseEntity {
  @ApiProperty({ description: 'Cluster this override applies to' })
  @Column({ type: 'uuid' })
  clusterId: string;

  @ManyToOne(() => Cluster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clusterId' })
  cluster: Cluster;

  @ApiPropertyOptional({
    enum: RotatorMode,
    description: 'null = inherit global defaults',
    nullable: true,
  })
  @Column({ type: 'simple-enum', enum: RotatorMode, nullable: true })
  rotationMode: RotatorMode | null;

  @ApiPropertyOptional({
    enum: RotatorDistribution,
    description: 'null = inherit global defaults',
    nullable: true,
  })
  @Column({ type: 'simple-enum', enum: RotatorDistribution, nullable: true })
  distribution: RotatorDistribution | null;

  @ApiPropertyOptional({
    enum: FeaturedSlotsMode,
    description: 'null = inherit global defaults',
    nullable: true,
  })
  @Column({ type: 'simple-enum', enum: FeaturedSlotsMode, nullable: true })
  featuredSlotsMode: FeaturedSlotsMode | null;

  @ApiPropertyOptional({
    example: 5,
    description: 'Manual slot count when featuredSlotsMode=manual',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  featuredSlotCount: number | null;

  @ApiProperty({
    description:
      'True when any field deviates from the global default (i.e. admin overrode the cluster).',
    default: false,
  })
  @Column({ default: false })
  isOverridden: boolean;

  @ApiPropertyOptional({
    description: 'When the override was last reset to automatic',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  resetAt: Date | null;
}
