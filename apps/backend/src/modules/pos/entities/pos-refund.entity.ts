import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import type { PosSale } from './pos-sale.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PosRefundItem } from './pos-refund-item.entity';

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
}

@Entity('pos_refunds')
export class PosRefund extends AbstractBaseEntity {
  @ManyToOne('PosSale', 'refunds', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: PosSale;

  @Column({ type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'refundedById' })
  refundedBy: User;

  @Column({ type: 'uuid' })
  refundedById: string;

  @ApiProperty({ example: 'Customer changed their mind' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ enum: RefundType, example: RefundType.FULL })
  @Column({ type: 'enum', enum: RefundType })
  type: RefundType;

  @ApiProperty({ example: 5000 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  refundAmount: number;

  @OneToMany('PosRefundItem', 'refund', { cascade: true })
  items: PosRefundItem[];
}
