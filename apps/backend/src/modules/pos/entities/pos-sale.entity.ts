import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { PosSaleItem } from './pos-sale-item.entity';
import { PosSplitPayment } from './pos-split-payment.entity';
import { PosRefund } from './pos-refund.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, SaleStatus } from './pos-enums';
import { CatalogueOrder } from '../../catalogue-orders/entities/catalogue-order.entity';

@Entity('pos_sales')
@Index(['businessId', 'createdAt'])
@Index(['receiptNumber'], { unique: true })
@Index(['cashierId'])
@Index(['customerId'])
@Index(['orderId'])
export class PosSale extends AbstractBaseEntity {
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

  @ApiProperty({ example: 'John Doe' })
  @Column({ nullable: true })
  cashierName: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @ApiProperty({ example: 'RCT-20260621-001' })
  @Column({ unique: true })
  receiptNumber: string;

  @ApiProperty({ example: 15000 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  subtotal: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  discountAmount: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  tax: number;

  @ApiProperty({ example: 15000 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  total: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  amountPaid: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  change: number;

  @ApiProperty({ example: false })
  @Column({ default: false })
  hideCustomerInfoOnReceipt: boolean;

  @ManyToOne(() => CatalogueOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: CatalogueOrder;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @ApiProperty({ example: 'Paid with NGN 5000 note', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ enum: SaleStatus, default: SaleStatus.COMPLETED })
  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @ApiProperty({ example: 'Customer changed their mind', nullable: true })
  @Column({ type: 'text', nullable: true })
  refundReason: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'refundedById' })
  refundedByUser: User;

  @Column({ type: 'uuid', nullable: true })
  refundedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  @OneToMany(() => PosSaleItem, (item) => item.sale, { cascade: true })
  items: PosSaleItem[];

  @OneToMany(() => PosSplitPayment, (sp) => sp.sale, { cascade: true })
  splitPayments: PosSplitPayment[];

  @OneToMany(() => PosRefund, (refund) => refund.sale, { cascade: true })
  refunds: PosRefund[];
}
