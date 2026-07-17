import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
export enum NotificationChannel {
  PUSH = 'Push',
  SMS = 'SMS',
  EMAIL = 'Email',
}

export enum NotificationDeliveryStatus {
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  FAILED = 'Failed',
}

export enum NotificationOpenStatus {
  OPENED = 'Opened',
  UNOPENED = 'Unopened',
  NA = 'N/A',
}

@Entity('notification_logs')
export class NotificationLog extends AbstractBaseEntity {
  @Column({ nullable: true })
  recipientId: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @Column({ type: 'simple-enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({
    type: 'simple-enum',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.SENT,
  })
  status: NotificationDeliveryStatus;

  @Column({
    type: 'simple-enum',
    enum: NotificationOpenStatus,
    default: NotificationOpenStatus.NA,
  })
  openStatus: NotificationOpenStatus;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;
}
