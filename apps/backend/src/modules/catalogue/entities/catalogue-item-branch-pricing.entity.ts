import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueItem } from './catalogue-item.entity';

const decimal = {
  type: 'decimal' as const,
  precision: 12,
  scale: 2,
  nullable: true,
  transformer: {
    to: (value: number | null) => value,
    from: (value: string | null) => (value == null ? null : parseFloat(value)),
  },
};

/**
 * A branch's own price / stock for an item whose `pricingMode` is
 * `per_branch`. Whether the branch carries the item at all stays in the
 * existing `catalogue_item_branches` join (read by cart, orders, POS and public
 * discovery), so this table only ever adds overrides on top of it. A null
 * column means "use the item's own value".
 */
@Entity('catalogue_item_branch_pricing')
@Unique('UQ_catalogue_item_branch_pricing_item_branch', ['itemId', 'branchId'])
export class CatalogueItemBranchPricing extends AbstractBaseEntity {
  @ManyToOne(() => CatalogueItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ApiProperty({ example: 14500, nullable: true })
  @Column(decimal)
  price: number | null;

  @ApiProperty({ example: 16000, nullable: true })
  @Column(decimal)
  compareAtPrice: number | null;

  @ApiProperty({ example: 24, nullable: true })
  @Column({ type: 'int', nullable: true })
  stockQuantity: number | null;
}
