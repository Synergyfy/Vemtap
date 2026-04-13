import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketMessage } from './ticket-message.entity';
import { TicketActivity } from './ticket-activity.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TicketStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CANCELLED = 'Cancelled',
}

export enum TicketPriority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum TicketType {
  CHAT = 'Chat',
  TICKET = 'Ticket',
}

@Entity('support_tickets')
export class SupportTicket {
  @ApiProperty({ example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ApiProperty({ example: 'John Doe', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  guestName: string | null;

  @ApiProperty({ example: 'john@example.com', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  guestEmail: string | null;

  @ApiProperty({ example: 'SMS credits not reflecting' })
  @Column()
  subject: string;

  @ApiProperty({ example: 'Support' })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.PENDING })
  @Index()
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.NORMAL })
  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
  })
  priority: TicketPriority;

  @ApiProperty({ enum: TicketType, example: TicketType.TICKET })
  @Index()
  @Column({
    type: 'enum',
    enum: TicketType,
    default: TicketType.TICKET,
  })
  type: TicketType;

  @ApiProperty({ example: 'Chatbot' })
  @Column({ nullable: true })
  channel: string;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages: TicketMessage[];

  @OneToMany(() => TicketActivity, (activity) => activity.ticket)
  activity: TicketActivity[];

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
