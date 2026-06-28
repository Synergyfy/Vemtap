import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CatalogueOrderItem } from './catalogue-order-item.entity';
import { Device } from '../../devices/entities/device.entity';

export enum CatalogueOrderStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
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

  @ApiProperty({
    enum: CatalogueOrderStatus,
    example: CatalogueOrderStatus.NEW,
  })
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

  @ApiProperty({ example: 'Customer request', nullable: true })
  @Column({ type: 'text', nullable: true })
  refundReason: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'refundedById' })
  refundedByUser: User;

  @Column({ type: 'uuid', nullable: true })
  refundedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  @OneToMany(
    () => CatalogueOrderItem,
    (item: CatalogueOrderItem) => item.order,
    {
      cascade: true,
    },
  )
  items: CatalogueOrderItem[];

  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ type: 'uuid', nullable: true })
  deviceId: string;

  /**
   * Session token passed from the frontend portal visit.
   * Used to link this order to the corresponding portal Visit record
   * so the visit can be upgraded to 'patronage' on order completion.
   */
  @ApiProperty({
    example: 'uuid-v4-session-token',
    nullable: true,
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  sessionToken: string;

  @ApiProperty({ example: '2024-05-20', nullable: true, required: false })
  @Column({ type: 'varchar', nullable: true })
  bookingDate: string;

  @ApiProperty({ example: '10:00 AM', nullable: true, required: false })
  @Column({ type: 'varchar', nullable: true })
  bookingTime: string;
}
