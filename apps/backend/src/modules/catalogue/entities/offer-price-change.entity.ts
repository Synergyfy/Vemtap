import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

const decimal = {
  type: 'decimal' as const,
  precision: 12,
  scale: 2,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  },
};

/**
 * One branch's deal price changing, recorded when an owner or manager edits a
 * deal's per-branch pricing. Read back as the deal's price-change history.
 */
@Entity('offer_price_changes')
@Index('IDX_offer_price_changes_group', ['businessId', 'dealGroupId'])
export class OfferPriceChange extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid' })
  dealGroupId: string;

  @Column({ type: 'uuid' })
  offerId: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchName: string | null;

  @Column(decimal)
  oldPrice: number;

  @Column(decimal)
  newPrice: number;

  @Column({ type: 'uuid', nullable: true })
  changedById: string | null;
}
