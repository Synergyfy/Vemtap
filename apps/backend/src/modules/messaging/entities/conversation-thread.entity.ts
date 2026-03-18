import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';

export interface ThreadNotes {
  internal?: string;
  tags?: string[];
  [key: string]: unknown;
}

export enum ThreadStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RESOLVED = 'RESOLVED',
}

@Entity('conversation_threads')
@Unique(['branchId', 'customerId', 'channel'])
export class ConversationThread extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid-branch' })
  @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid-business' })
  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ApiProperty({ example: 'uuid-customer' })
  @Column()
  customerId: string;

  @ApiProperty({ enum: Channel, example: Channel.IN_HOUSE })
  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  @ApiProperty({ enum: ThreadStatus, example: ThreadStatus.OPEN })
  @Column({ type: 'enum', enum: ThreadStatus, default: ThreadStatus.OPEN })
  status: ThreadStatus;

  @ApiPropertyOptional({ example: 'Hello!', description: 'Last message snippet' })
  @Column({ type: 'text', nullable: true })
  lastMessageContent: string;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  branchUnreadCount: number;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  customerUnreadCount: number;

  @ApiPropertyOptional({ example: {} })
  @Column({ type: 'jsonb', nullable: true })
  notes: ThreadNotes;
}
