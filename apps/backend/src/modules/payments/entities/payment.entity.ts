import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum PaymentStatus {
  PENDING = 'Pending',
  SUCCESS = 'Success',
  FAILED = 'Failed',
}

export enum PaymentPurpose {
  ORDER = 'Order',
  SUBSCRIPTION = 'Subscription',
  CREDIT_TOPUP = 'Credit Topup',
  ADDON = 'Addon',
  PLAN_WITH_ADDONS = 'Plan With Addons',
}

@Entity('payments')
export class Payment extends AbstractBaseEntity {
  @ApiProperty({ example: 'T123456789' })
  @Column({ unique: true })
  reference: string;

  @ApiProperty({ example: 5000 })
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  @Column({ default: 'NGN' })
  currency: string;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentPurpose })
  @Column({
    type: 'simple-enum',
    enum: PaymentPurpose,
  })
  purpose: PaymentPurpose;

  @ApiProperty({ example: '{}' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  businessId: string;
}
