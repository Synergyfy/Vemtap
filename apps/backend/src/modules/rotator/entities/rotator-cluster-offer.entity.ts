import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Cluster } from '../../clusters/entities/cluster.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { DeliveryOverride } from './rotator-config.entity';

@Entity('rotator_cluster_offers')
@Index('idx_rotator_cluster_offers_cluster', ['clusterId'])
@Index('idx_rotator_cluster_offers_unique', ['clusterId', 'offerId'], {
  unique: true,
})
export class RotatorClusterOffer extends AbstractBaseEntity {
  @ApiProperty({ description: 'Cluster the offer row belongs to' })
  @Column({ type: 'uuid' })
  clusterId: string;

  @ManyToOne(() => Cluster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clusterId' })
  cluster: Cluster;

  @ApiProperty({ description: 'Catalogue offer' })
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiProperty({
    example: true,
    description: 'Manual-mode membership: true = included, false = excluded',
  })
  @Column({ default: true })
  included: boolean;

  @ApiPropertyOptional({
    enum: DeliveryOverride,
    description: 'null = inherit automatic delivery',
    nullable: true,
  })
  @Column({ type: 'simple-enum', enum: DeliveryOverride, nullable: true })
  deliveryOverride: DeliveryOverride | null;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Manual delivery weight (e.g. 1–5) when deliveryOverride=manual',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight: number | null;

  @ApiPropertyOptional({
    description: 'Admin who last set this row',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  setBy: string | null;
}
