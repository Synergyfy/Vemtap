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

/**
 * What the conversation is about. Set at thread start when the app opens a
 * chat from a deal/claim/order/booking context; defaults to GENERAL. Threads
 * keep one row per branch+customer+channel, so this is latest-context metadata.
 */
export enum ThreadSubjectType {
  GENERAL = 'GENERAL',
  DEAL = 'DEAL',
  CLAIM = 'CLAIM',
  ORDER = 'ORDER',
  BOOKING = 'BOOKING',
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

  @ApiPropertyOptional({
    example: 'Hello!',
    description: 'Last message snippet',
  })
  @Column({ type: 'text', nullable: true })
  lastMessageContent: string;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  branchUnreadCount: number;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  customerUnreadCount: number;

  @ApiProperty({
    enum: ThreadSubjectType,
    example: ThreadSubjectType.GENERAL,
    description: 'Latest conversation context',
  })
  @Column({
    type: 'enum',
    enum: ThreadSubjectType,
    default: ThreadSubjectType.GENERAL,
  })
  subjectType: ThreadSubjectType;

  @ApiPropertyOptional({ example: 'uuid-of-claim', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  claimId: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-order', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ApiPropertyOptional({ example: {} })
  @Column({ type: 'jsonb', nullable: true })
  notes: ThreadNotes;
}
