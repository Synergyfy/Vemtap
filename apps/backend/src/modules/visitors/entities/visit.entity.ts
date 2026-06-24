import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueOrder } from '../../catalogue-orders/entities/catalogue-order.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('visits')
export class Visit extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.visits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Branch, (branch) => branch.visits, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @ManyToOne(() => Device, (device) => device.visits, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ nullable: true })
  deviceId: string;

  @Column({
    type: 'varchar',
    default: 'new',
  })
  status: 'new' | 'returning';

  @OneToOne(() => CatalogueOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: CatalogueOrder;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  // --- Smart Visit Tracking ---

  @Column({
    type: 'varchar',
    default: 'portal',
    nullable: true,
  })
  visitType: 'portal' | 'patronage';

  /**
   * A unique token minted per browser session on the frontend.
   * Used to link a portal visit to its eventual patronage upgrade,
   * and to enforce idempotency (same token = same visit row).
   */
  @Column({ type: 'uuid', nullable: true, unique: true })
  sessionToken: string;

  /** Timestamp when this visit was upgraded from portal → patronage. */
  @Column({ type: 'timestamptz', nullable: true })
  upgradedAt: Date;

  /** Stored for fraud-detection and IP rate limiting. */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  /** Stored for device fingerprinting / fraud detection. */
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @ApiProperty({ example: 'uuid-string', description: 'ID of the partner branch that referred this customer', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  referredByBranchId: string | null;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'referredByBranchId' })
  referredByBranch: Branch;

  @ApiProperty({ example: 'uuid-string', description: 'ID of the Catalogue Offer (Promotion) that drove this visit', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  catalogueOfferId: string | null;

  @ManyToOne('CatalogueOffer', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'catalogueOfferId' })
  catalogueOffer: any;
}
