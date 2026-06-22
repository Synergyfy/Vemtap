import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { PosHeldSale } from './pos-held-sale.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pos_held_sale_items')
export class PosHeldSaleItem extends AbstractBaseEntity {
  @ManyToOne(() => PosHeldSale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'heldSaleId' })
  heldSale: PosHeldSale;

  @Column({ type: 'uuid' })
  heldSaleId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string;

  @ApiProperty({ example: 'Classic Beef Burger' })
  @Column()
  productName: string;

  @ApiProperty({ example: 'FF-001' })
  @Column({ nullable: true })
  sku: string;

  @ApiProperty({ example: 'VMT0001' })
  @Column({ nullable: true })
  barcode: string;

  @ApiProperty({ example: 4500 })
  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  unitPrice: number;

  @ApiProperty({ example: 2500 })
  @Column({
    type: 'decimal', precision: 12, scale: 2, nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  costPrice: number;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  discount: number;

  @ApiProperty({ example: 9000 })
  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  totalPrice: number;
}
