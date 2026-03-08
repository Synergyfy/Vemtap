import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull, FindOptionsWhere } from 'typeorm';
import {
  SupportTicket,
  TicketStatus,
  TicketType,
} from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketActivity } from './entities/ticket-activity.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { AgentStatsDto } from './dto/agent-stats.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    @InjectRepository(TicketActivity)
    private activityRepository: Repository<TicketActivity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      userId,
      subject: dto.subject,
      category: dto.category,
      status: TicketStatus.PENDING,
      type: TicketType.TICKET,
    });
    await this.ticketRepository.save(ticket);

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      message: dto.message,
    });
    await this.messageRepository.save(message);

    await this.logActivity(ticket.id, 'Ticket created', 'Customer');

    return ticket;
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const [data, total] = await this.ticketRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, userId },
      relations: ['messages', 'messages.sender', 'activity'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    messageText: string,
  ): Promise<TicketMessage> {
    const ticket = await this.findOne(ticketId, userId);

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      message: messageText,
    });

    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CANCELLED
    ) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
      await this.logActivity(ticket.id, 'Ticket reopened', 'Customer');
    }

    return this.messageRepository.save(message);
  }

  // --- Agent Methods ---

  async getAgentStats(agentId: string): Promise<AgentStatsDto> {
    const assignedChats = await this.ticketRepository.count({
      where: {
        assignedToId: agentId,
        type: TicketType.CHAT,
        status: TicketStatus.IN_PROGRESS,
      },
    });

    const openTickets = await this.ticketRepository.count({
      where: {
        assignedToId: agentId,
        type: TicketType.TICKET,
        status: TicketStatus.PENDING,
      },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const resolvedToday = await this.ticketRepository.count({
      where: {
        assignedToId: agentId,
        status: TicketStatus.RESOLVED,
        updatedAt: Between(startOfDay, endOfDay),
      },
    });

    return {
      assignedChats,
      openTickets,
      resolvedToday,
      avgResponseTime: '4m', // Placeholder
    };
  }

  async findAssigned(
    agentId: string,
    type: TicketType,
    page: number = 1,
    limit: number = 10,
  ) {
    const [data, total] = await this.ticketRepository.findAndCount({
      where: { assignedToId: agentId, type },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOneAgent(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['messages', 'messages.sender', 'user', 'activity'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatusAgent(
    id: string,
    agentId: string,
    status: TicketStatus,
  ): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = status;
    const updated = await this.ticketRepository.save(ticket);

    await this.logActivity(id, `Status -> ${status}`, 'Agent');

    return updated;
  }

  async addAgentMessage(
    ticketId: string,
    agentId: string,
    messageText: string,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: agentId,
      message: messageText,
    });

    if (ticket.status === TicketStatus.PENDING) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    const savedMessage = await this.messageRepository.save(message);
    await this.logActivity(ticketId, 'Reply sent', 'Agent');

    return savedMessage;
  }

  async updateAgentProfile(agentId: string, dto: UpdateAgentProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: agentId } });
    if (!user) throw new NotFoundException('Agent not found');

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.email) user.email = dto.email;
    if (dto.phone) user.phone = dto.phone;

    return this.userRepository.save(user);
  }

  private async logActivity(ticketId: string, action: string, by: string) {
    const activity = this.activityRepository.create({
      ticketId,
      action,
      by,
    });
    await this.activityRepository.save(activity);
  }

  async findAllAgents(page: number = 1, limit: number = 10) {
    const [data, total] = await this.userRepository.findAndCount({
      where: { role: UserRole.AGENT },
      select: ['id', 'firstName', 'lastName', 'email', 'status', 'lastActive'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // --- Admin Methods ---

  async findAllAdmin(
    type?: TicketType,
    isAssigned?: boolean,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: FindOptionsWhere<SupportTicket> = {};
    if (type) where.type = type;
    if (isAssigned !== undefined) {
      where.assignedToId = isAssigned ? Not(IsNull()) : IsNull();
    }

    const [data, total] = await this.ticketRepository.findAndCount({
      where,
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['messages', 'messages.sender', 'user', 'activity'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = status;
    const updated = await this.ticketRepository.save(ticket);
    await this.logActivity(id, `Status -> ${status} (Admin)`, 'Admin');
    return updated;
  }

  async assignTicket(id: string, agentId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const agent = await this.userRepository.findOne({
      where: { id: agentId, role: UserRole.AGENT },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    ticket.assignedToId = agentId;
    const updated = await this.ticketRepository.save(ticket);

    await this.logActivity(
      id,
      `Assigned to ${agent.firstName} ${agent.lastName}`,
      'Admin',
    );

    return updated;
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

    if (ticket.status === TicketStatus.PENDING) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    const savedMessage = await this.messageRepository.save(message);
    await this.logActivity(ticketId, 'Admin Reply sent', 'Admin');

    return savedMessage;
  }
}
