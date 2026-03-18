import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { MessageDirection, MessageStatus } from '../enums/message.enum';

@Entity('message_logs')
export class MessageLog extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  messageId: string;

  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @Column({ type: 'enum', enum: MessageStatus })
  status: MessageStatus;

  @Column({ nullable: true })
  errorReason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'int', nullable: true })
  units?: number;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
