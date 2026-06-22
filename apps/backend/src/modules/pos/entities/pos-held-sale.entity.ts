import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { PosHeldSaleItem } from './pos-held-sale-item.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pos_held_sales')
@Index(['businessId', 'cashierId'])
export class PosHeldSale extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashierId' })
  cashier: User;

  @Column({ type: 'uuid' })
  cashierId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @ApiProperty({ example: 15000 })
  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  subtotal: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  discountAmount: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  tax: number;

  @ApiProperty({ example: 15000 })
  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  total: number;

  @ApiProperty({ example: 'Waiting for customer' })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  heldAt: Date;

  @OneToMany(() => PosHeldSaleItem, (item) => item.heldSale, { cascade: true })
  items: PosHeldSaleItem[];
}
