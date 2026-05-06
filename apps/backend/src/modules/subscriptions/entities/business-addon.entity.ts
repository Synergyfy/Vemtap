import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AddOn } from './addon.entity';
import { Business } from '../../businesses/entities/business.entity';

export enum BusinessAddOnStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

@Entity('business_addons')
export class BusinessAddOn extends AbstractBaseEntity {
  @ManyToOne(() => AddOn, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'addonId' })
  addon: AddOn;

  @Index('IDX_business_addons_addonId')
  @Column()
  addonId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Index('IDX_business_addons_businessId')
  @Column()
  businessId: string;

  @Index('IDX_business_addons_status')
  @Column({
    type: 'simple-enum',
    enum: BusinessAddOnStatus,
    default: BusinessAddOnStatus.ACTIVE,
  })
  status: BusinessAddOnStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchasedAt: Date;

  @Index('IDX_business_addons_expiresAt')
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPaid: number;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  paystackAuthorizationCode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}