import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { PosSale } from './pos-sale.entity';
import { PaymentMethod } from './pos-enums';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pos_split_payments')
export class PosSplitPayment extends AbstractBaseEntity {
  @ManyToOne(() => PosSale, (sale) => sale.splitPayments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'saleId' })
  sale: PosSale;

  @Column({ type: 'uuid' })
  saleId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ example: 7500 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  amount: number;
}
