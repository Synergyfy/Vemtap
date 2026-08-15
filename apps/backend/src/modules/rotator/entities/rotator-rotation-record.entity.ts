import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Cluster } from '../../clusters/entities/cluster.entity';

@Entity('rotator_rotation_records')
@Index('idx_rotator_records_cluster_window', ['clusterId', 'windowId'], {
  unique: true,
})
export class RotatorRotationRecord extends AbstractBaseEntity {
  @ApiProperty({ description: 'Cluster the window selection belongs to' })
  @Column({ type: 'uuid' })
  clusterId: string;

  @ManyToOne(() => Cluster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clusterId' })
  cluster: Cluster;

  @ApiProperty({ description: 'Rotation window id (floor(now / windowMs))' })
  @Column({ type: 'bigint' })
  windowId: string;

  @ApiProperty({ description: 'Window start timestamp' })
  @Column({ type: 'timestamp' })
  windowStart: Date;

  @ApiProperty({ description: 'Window end timestamp' })
  @Column({ type: 'timestamp' })
  windowEnd: Date;

  @ApiProperty({
    description: 'Exact ordered offer ids selected for this window',
  })
  @Column({ type: 'jsonb' })
  offerIds: string[];

  @ApiProperty({ description: 'Number of featured slots in this window' })
  @Column({ type: 'int' })
  slotCount: number;
}
