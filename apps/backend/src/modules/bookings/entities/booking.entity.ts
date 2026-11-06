import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  BOOKED = 'booked',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
@Index(['branchId', 'date', 'status'])
export class Booking extends AbstractBaseEntity {
  @ApiProperty({ example: 'uuid-of-customer' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid' })
  customerId: string;

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

  @ApiProperty({
    example: 'uuid-of-catalogue-item',
    nullable: true,
    description: 'Booked catalogue service; null for a generic branch booking',
  })
  @ManyToOne(() => CatalogueItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem | null;

  @Column({ type: 'uuid', nullable: true })
  itemId: string | null;

  @ApiProperty({ example: 'Private Event Catering' })
  @Column()
  itemName: string;

  @ApiProperty({
    example: '2026-10-20',
    description: 'Booking date (YYYY-MM-DD)',
  })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ example: '14:30', description: 'Slot start time (HH:mm)' })
  @Column({ length: 5 })
  time: string;

  @ApiProperty({ example: 60 })
  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.BOOKED })
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.BOOKED,
  })
  status: BookingStatus;

  @ApiProperty({
    example: 'BK-4F2A9C',
    description: 'Customer-facing booking reference',
  })
  @Column({ unique: true })
  reference: string;

  @ApiProperty({ example: 'Window seat if possible', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-10-19T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ example: 'Change of plans', nullable: true })
  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;
}
