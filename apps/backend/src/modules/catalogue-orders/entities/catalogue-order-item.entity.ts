import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOrder } from './catalogue-order.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('catalogue_order_items')
export class CatalogueOrderItem extends AbstractBaseEntity {
  @ManyToOne(() => CatalogueOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: CatalogueOrder;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => CatalogueItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  @Column({ type: 'uuid', nullable: true })
  itemId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @Column({ type: 'uuid', nullable: true })
  offerId: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 15.99 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  priceAtOrder: number;

  @ApiProperty({ example: 10, nullable: true })
  @Column({ type: 'int', nullable: true })
  loyaltyPointsAtOrder: number | null;

  @ApiProperty({
    example: 0,
    description: 'Number of units refunded for this item',
  })
  @Column({ type: 'int', default: 0 })
  refundedQuantity: number;
}
