import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
  ) {}

  async create(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      userId,
      subject: dto.subject,
      category: dto.category,
      status: TicketStatus.OPEN,
    });
    await this.ticketRepository.save(ticket);

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      message: dto.message,
    });
    await this.messageRepository.save(message);

    return ticket;
  }

  async findAll(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, userId },
      relations: ['messages', 'messages.sender'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    messageText: string,
  ): Promise<TicketMessage> {
    const ticket = await this.findOne(ticketId, userId); // Ensure user owns ticket

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      message: messageText,
    });

    if (ticket.status === TicketStatus.CLOSED) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    return this.messageRepository.save(message);
  }

  // --- Admin Methods ---

  async findAllAdmin(): Promise<SupportTicket[]> {
    return this.ticketRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAdmin(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['messages', 'messages.sender', 'user'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = status;
    return this.ticketRepository.save(ticket);
  }

  async addAdminMessage(
    ticketId: string,
    adminId: string,
    messageText: string,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: adminId,
      message: messageText,
    });

    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    return this.messageRepository.save(message);
  }
}
