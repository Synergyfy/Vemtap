import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { User } from '../../users/entities/user.entity';

export interface TicketAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages)
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column('text')
  message: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'CUSTOMER',
  })
  senderRole: 'CUSTOMER' | 'AGENT' | 'BOT' | 'SYSTEM';

  @Column({ type: 'jsonb', nullable: true })
  attachments: TicketAttachment[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
