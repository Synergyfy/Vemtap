import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

/** A message between two member branches of the same cluster. */
@Entity('cluster_messages')
@Index('IDX_cluster_messages_pair', [
  'clusterId',
  'fromBranchId',
  'toBranchId',
  'createdAt',
])
export class ClusterMessage extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  clusterId: string;

  @Column({ type: 'uuid' })
  fromBranchId: string;

  @Column({ type: 'uuid' })
  toBranchId: string;

  @Column({ type: 'uuid' })
  senderUserId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;
}
