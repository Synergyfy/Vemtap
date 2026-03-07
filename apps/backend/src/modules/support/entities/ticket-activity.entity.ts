import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ticket_activity')
export class TicketActivity {
  @ApiProperty({ example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.activity)
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @ApiProperty({ example: 'Assigned to Agent' })
  @Column()
  action: string;

  @ApiProperty({ example: 'Admin' })
  @Column()
  by: string;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}
