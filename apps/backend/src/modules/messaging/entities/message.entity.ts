import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ConversationThread } from './conversation-thread.entity';
import { MessageCampaign } from './message-campaign.entity';
import { Channel } from '../enums/channel.enum';
import { MessageDirection, MessageStatus } from '../enums/message.enum';

export interface MessageMetadata {
  browser?: string;
  deviceType?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

@Entity('messages')
export class Message extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ nullable: true })
  customerId: string;

  @ManyToOne(() => ConversationThread, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'threadId' })
  thread: ConversationThread;

  @Column({ nullable: true })
  threadId: string;

  @ManyToOne(() => MessageCampaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaignId' })
  campaign: MessageCampaign;

  @ApiProperty({ example: 'Hello, how are you?', description: 'Content of the message' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ enum: Channel, example: Channel.IN_HOUSE })
  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @ApiProperty({ enum: MessageDirection, example: MessageDirection.OUTBOUND })
  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @ApiProperty({ enum: MessageStatus, example: MessageStatus.DELIVERED })
  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.PENDING })
  status: MessageStatus;

  @ApiProperty({ example: 'Business Name', description: 'Sender identifier' })
  @Column({ nullable: true })
  from: string;

  @ApiProperty({ example: '+1234567890', description: 'Recipient identifier' })
  @Column({ nullable: true })
  to: string;

  @ApiProperty({ example: 'uuid-of-provider-msg', nullable: true })
  @Column({ nullable: true })
  providerMessageId: string;

  @ApiProperty({ example: 0.05, nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  cost?: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ type: 'int', nullable: true })
  units?: number;

  @ApiProperty({ example: 'ref-123', nullable: true })
  @Column({ nullable: true })
  reference?: string;

  @ApiPropertyOptional({ type: () => Message, description: 'The message being replied to' })
  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo: Message;

  @ApiPropertyOptional({ example: 'uuid-123' })
  @Column({ nullable: true })
  replyToId: string;

  @ApiPropertyOptional({ example: { browser: 'Chrome' }, description: 'Channel-specific metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: MessageMetadata;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isEdited: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isDeleted: boolean;
}
