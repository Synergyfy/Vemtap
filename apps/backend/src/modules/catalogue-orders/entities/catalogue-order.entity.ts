import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CatalogueOrderItem } from './catalogue-order-item.entity';

export enum CatalogueOrderStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('catalogue_orders')
export class CatalogueOrder extends AbstractBaseEntity {
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
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid' })
  customerId: string;

  @ApiProperty({ enum: CatalogueOrderStatus, example: CatalogueOrderStatus.NEW })
  @Column({
    type: 'enum',
    enum: CatalogueOrderStatus,
    default: CatalogueOrderStatus.NEW,
  })
  status: CatalogueOrderStatus;

  @ApiProperty({ example: 'Please no onions', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 'Table 5', nullable: true })
  @Column({ nullable: true })
  tableNumber: string;

  @ApiProperty({ example: 45.97 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalAmount: number;

  @ApiProperty({ example: false })
  @Column({ default: false })
  loyaltyAwarded: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  stockDeducted: boolean;

  @OneToMany(() => CatalogueOrderItem, (item: CatalogueOrderItem) => item.order, {
    cascade: true,
  })
  items: CatalogueOrderItem[];
}
