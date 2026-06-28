import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { PosRefund } from './pos-refund.entity';
import { PosSaleItem } from './pos-sale-item.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pos_refund_items')
export class PosRefundItem extends AbstractBaseEntity {
  @ManyToOne(() => PosRefund, (refund) => refund.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refundId' })
  refund: PosRefund;

  @Column({ type: 'uuid' })
  refundId: string;

  @ManyToOne(() => PosSaleItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleItemId' })
  saleItem: PosSaleItem;

  @Column({ type: 'uuid' })
  saleItemId: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 9000 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  amount: number;
}
