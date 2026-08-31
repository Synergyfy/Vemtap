import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('subscription_reminder_templates')
export class SubscriptionReminderTemplate extends AbstractBaseEntity {
  @ApiProperty({
    example: 14,
    description: 'Stage in days before expiry (e.g. 14, 7, 3) or 0 for lapsed/expired/inactive',
  })
  @Column({ type: 'int', unique: true })
  stage: number;

  @ApiProperty({
    example: '14-Day Expiry Reminder',
    description: 'Human-readable name of the template',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'Sent 14 days before subscription expires to nudge renewal',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    example: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
    description: 'Title template supporting {{variable}} tags',
  })
  @Column()
  titleTemplate: string;

  @ApiProperty({
    example: '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
    description: 'Body message template supporting {{variable}} tags',
  })
  @Column({ type: 'text' })
  messageTemplate: string;

  @ApiProperty({
    example: 'warning',
    description: 'Notification type: warning, error, info',
  })
  @Column({ default: 'warning' })
  type: string;

  @ApiProperty({
    example: '/dashboard/settings/subscription',
    description: 'Action deep link URL',
  })
  @Column({ default: '/dashboard/settings/subscription' })
  actionUrl: string;

  @ApiProperty({
    example: true,
    description: 'Whether this reminder stage is active',
  })
  @Column({ default: true })
  isEnabled: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether to send Web Push notification',
  })
  @Column({ default: true })
  sendPush: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether to send in-app notification',
  })
  @Column({ default: true })
  sendInApp: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether to send email reminder',
  })
  @Column({ default: false })
  sendEmail: boolean;

  @ApiProperty({
    example: 'Action Required: Your {{planName}} expires in {{daysLeft}} days',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  emailSubjectTemplate: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether this template is protected as a system default',
  })
  @Column({ default: false })
  isDefault: boolean;
}
