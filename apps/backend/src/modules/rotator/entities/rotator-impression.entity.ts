import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Cluster } from '../../clusters/entities/cluster.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';

export enum RotatorEventType {
  IMPRESSION = 'impression',
  VIEW = 'view',
  CLICK = 'click',
}

@Entity('rotator_impressions')
@Index('idx_rotator_impressions_cluster_window', ['clusterId', 'windowId'])
@Index('idx_rotator_impressions_offer', ['offerId'])
@Index('idx_rotator_impressions_customer', ['customerId'])
export class RotatorImpression extends AbstractBaseEntity {
  @ApiProperty({ description: 'Cluster the event occurred in' })
  @Column({ type: 'uuid' })
  clusterId: string;

  @ManyToOne(() => Cluster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clusterId' })
  cluster: Cluster;

  @ApiProperty({ description: 'Offer the event relates to' })
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiProperty({ description: 'Rotation window id the event happened in' })
  @Column({ type: 'bigint' })
  windowId: string;

  @ApiProperty({ enum: RotatorEventType })
  @Column({ type: 'simple-enum', enum: RotatorEventType })
  eventType: RotatorEventType;

  @ApiPropertyOptional({
    description: 'Customer id when identifiable (guest scans are null)',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ApiPropertyOptional({
    description: 'Browser session token used for unique-reach and idempotency',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  sessionToken: string | null;
}
