import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TargetAudience {
  ALL = 'ALL',
  BUSINESSES = 'BUSINESSES',
  CUSTOMERS = 'CUSTOMERS',
  AGENTS = 'AGENTS',
}

export enum BroadcastStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
}

@Entity('notification_broadcasts')
export class NotificationBroadcast extends AbstractBaseEntity {
  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: User | null;

  @ApiProperty({ example: 'Special Holiday Promo' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Enjoy 20% discount on all store items today!' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.ALL })
  @Column({
    type: 'simple-enum',
    enum: TargetAudience,
    default: TargetAudience.ALL,
  })
  targetAudience: TargetAudience;

  @ApiProperty({ example: 'announcement' })
  @Column({ default: 'announcement' })
  type: string;

  @ApiProperty({ example: '/dashboard/deals', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  actionUrl: string | null;

  @ApiProperty({ example: ['IN_APP', 'PUSH'] })
  @Column({ type: 'simple-array', default: 'IN_APP,PUSH' })
  channels: string[];

  @ApiProperty({ example: 120 })
  @Column({ default: 0 })
  totalRecipients: number;

  @ApiProperty({ example: 45 })
  @Column({ default: 0 })
  pushRecipients: number;

  @ApiProperty({ enum: BroadcastStatus, example: BroadcastStatus.SENT })
  @Column({
    type: 'simple-enum',
    enum: BroadcastStatus,
    default: BroadcastStatus.SENT,
  })
  status: BroadcastStatus;

  @ApiProperty({ example: {}, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
