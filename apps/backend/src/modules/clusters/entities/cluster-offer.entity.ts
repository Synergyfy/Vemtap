import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Cluster } from './cluster.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cluster_offers')
@Index('idx_cluster_offers_cluster', ['clusterId'])
@Index('idx_cluster_offers_unique', ['clusterId', 'offerId'], { unique: true })
export class ClusterOffer extends AbstractBaseEntity {
  @ApiProperty({ description: 'Cluster the offer is attached to' })
  @Column({ type: 'uuid' })
  clusterId: string;

  @ManyToOne(() => Cluster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clusterId' })
  cluster: Cluster;

  @ApiProperty({ description: 'Catalogue offer attached to the cluster' })
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiProperty({ example: true, description: 'Whether the offer is pinned' })
  @Column({ default: true })
  isPinned: boolean;

  @ApiProperty({
    description: 'Admin who pinned/unpinned the offer',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  pinnedBy: string;

  @ApiProperty({
    description: 'When the offer was last pinned',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  pinnedAt: Date;
}
