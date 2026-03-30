import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueCart } from './catalogue-cart.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';

@Entity('catalogue_cart_items')
export class CatalogueCartItem extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  cartId: string;

  @ManyToOne(() => CatalogueCart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: CatalogueCart;

  @Column({ type: 'uuid', nullable: true })
  itemId: string | null;

  @ManyToOne(() => CatalogueItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  @Column({ type: 'uuid', nullable: true })
  offerId: string | null;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  snapshotPrice: number;

  @Column({ type: 'varchar', length: 255 })
  snapshotName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  snapshotImage: string | null;
}
