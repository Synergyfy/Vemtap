import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export const SHOWCASE_ENTITY_TYPES = ['deal', 'product', 'service'] as const;
export type ShowcaseEntityType = (typeof SHOWCASE_ENTITY_TYPES)[number];

/**
 * A branch's choice for one of its deals, products or services in its
 * cluster. Deals show by default (a row with `show = false` hides one from the
 * cluster feed and the rotator); products and services show only when opted in.
 */
@Entity('cluster_showcase_items')
@Index('UQ_cluster_showcase_item', ['branchId', 'entityType', 'entityId'], {
  unique: true,
})
export class ClusterShowcaseItem extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'varchar', length: 10 })
  entityType: ShowcaseEntityType;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ default: true })
  show: boolean;
}

/**
 * Raw `WHERE` fragment for cluster offer queries aliased `offer`: drops deals
 * their business hid from the cluster.
 */
export const NOT_HIDDEN_FROM_CLUSTER_SQL = `NOT EXISTS (
  SELECT 1 FROM "cluster_showcase_items" csi
  WHERE csi."entityType" = 'deal' AND csi."entityId" = offer."id"
    AND csi."show" = false AND csi."deletedAt" IS NULL
)`;
