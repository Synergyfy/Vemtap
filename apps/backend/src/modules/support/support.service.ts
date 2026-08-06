import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull, FindOptionsWhere } from 'typeorm';
import {
  SupportTicket,
  TicketPriority,
  TicketStatus,
  TicketType,
} from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketActivity } from './entities/ticket-activity.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { AgentStatsDto } from './dto/agent-stats.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { AddTicketAttachmentsDto } from './dto/ticket-attachment.dto';

import { SupportGateway } from './support.gateway';
import { ConversationContextService } from './conversation-context.service';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';

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
    private readonly supportGateway: SupportGateway,
    private readonly conversationContextService: ConversationContextService,
  ) {}

  async escalateChat(
    userId: string | null,
    initialMessage?: string,
    guestName?: string,
    guestEmail?: string,
    sessionId?: string,
  ): Promise<SupportTicket> {
    // Check for existing active chat
    const existingTicket = await this.ticketRepository.findOne({
      where: userId
        ? [
            { userId, type: TicketType.CHAT, status: TicketStatus.PENDING },
            { userId, type: TicketType.CHAT, status: TicketStatus.IN_PROGRESS },
          ]
        : [
            {
              guestEmail,
              type: TicketType.CHAT,
              status: TicketStatus.PENDING,
            },
            {
              guestEmail,
              type: TicketType.CHAT,
              status: TicketStatus.IN_PROGRESS,
            },
          ],
      order: { createdAt: 'DESC' },
    });

    if (existingTicket) {
      return existingTicket;
    }

    const ticket = this.ticketRepository.create({
      userId,
      guestName,
      guestEmail,
      subject: 'Live Support Chat',
      category: 'Support',
      status: TicketStatus.PENDING,
      type: TicketType.CHAT,
      channel: 'Chatbot',
    });
    const savedTicket = await this.ticketRepository.save(ticket);

    // Persist bot conversation history
    const botContext = await this.conversationContextService.getContext(
      userId,
      sessionId,
    );
    if (botContext && botContext.messages && botContext.messages.length > 0) {
      const historyMessages = botContext.messages.map((msg) =>
        this.messageRepository.create({
          ticketId: savedTicket.id,
          senderId: msg.role === 'user' ? userId : null,
          senderRole: msg.role === 'user' ? 'CUSTOMER' : 'BOT',
          message: msg.content,
          createdAt: msg.timestamp || new Date(),
        }),
      );
      await this.messageRepository.save(historyMessages);
    }

    if (initialMessage) {
      const message = this.messageRepository.create({
        ticketId: savedTicket.id,
        senderId: userId,
        senderRole: 'CUSTOMER',
        message: initialMessage,
      });
      const savedMessage = await this.messageRepository.save(message);

      // Notify admins/agents about the new chat
      this.supportGateway.emitNewMessage(savedTicket.id, {
        ...savedMessage,
        ticket: savedTicket,
      });
    }

    await this.logActivity(
      savedTicket.id,
      'Chat escalated to human agent',
      'System',
    );

    // Broadcast status update
    this.supportGateway.emitTicketStatusUpdate(
      savedTicket.id,
      TicketStatus.PENDING,
    );

    // Notify all admins about the new chat session
    this.supportGateway.emitNewChatEscalated(savedTicket);

    return savedTicket;
  }

  async create(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      userId,
      subject: dto.subject,
      category: dto.category,
      status: TicketStatus.PENDING,
      priority: dto.priority ?? TicketPriority.NORMAL,
      type: TicketType.TICKET,
    });
    await this.ticketRepository.save(ticket);

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      senderRole: 'CUSTOMER',
      message: dto.message,
    });
    await this.messageRepository.save(message);

    await this.logActivity(ticket.id, 'Ticket created', 'Customer');

    return ticket;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    cursor?: string,
  ) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.userId = :userId', { userId });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'ticket',
    });

    return {
      data: result.data,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: {
        total: result.total,
        page: result.page,
        lastPage: result.meta.lastPage,
      },
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
      senderRole: 'CUSTOMER',
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

    const savedMessage = await this.messageRepository.save(message);

    // Real-time event
    this.supportGateway.emitNewMessage(ticket.id, savedMessage);

    return savedMessage;
  }

  async addAttachments(
    ticketId: string,
    userId: string,
    dto: AddTicketAttachmentsDto,
  ): Promise<TicketMessage> {
    if (!dto.attachments?.length) {
      throw new BadRequestException('At least one attachment is required');
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB total

    let totalSize = 0;
    for (const file of dto.attachments) {
      const actualSize = this.estimateAttachmentSize(file.url, file.size);
      if (actualSize > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${file.name}" exceeds the 10 MB per-file limit`,
        );
      }
      totalSize += actualSize;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new BadRequestException(
        'Total attachment size exceeds the 25 MB limit',
      );
    }

    const ticket = await this.findOne(ticketId, userId);

    const message = this.messageRepository.create({
      ticketId: ticket.id,
      senderId: userId,
      senderRole: 'CUSTOMER',
      message: dto.message?.trim() || '<attachment>',
      attachments: dto.attachments,
    });

    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CANCELLED
    ) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
      await this.logActivity(ticket.id, 'Ticket reopened', 'Customer');
    }

    const savedMessage = await this.messageRepository.save(message);

    this.supportGateway.emitNewMessage(ticket.id, savedMessage);

    return savedMessage;
  }

  private estimateAttachmentSize(url: string, reportedSize: number): number {
    // For base64 data URLs, compute the real decoded byte length so a spoofed
    // `size` field can't bypass the upload limits. Remote URLs are trusted
    // metadata (size is not verifiable without downloading).
    if (url.startsWith('data:')) {
      const commaIndex = url.indexOf(',');
      if (commaIndex >= 0) {
        const b64 = url.slice(commaIndex + 1);
        const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
        return Math.max(
          reportedSize,
          Math.floor((b64.length * 3) / 4) - padding,
        );
      }
    }
    return reportedSize;
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
    cursor?: string,
  ) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .where('ticket.assignedToId = :agentId AND ticket.type = :type', {
        agentId,
        type,
      });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'updatedAt',
      sortOrder: 'DESC',
      entityAlias: 'ticket',
    });

    return {
      data: result.data,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: {
        total: result.total,
        page: result.page,
        lastPage: result.meta.lastPage,
      },
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
      senderRole: 'AGENT',
      message: messageText,
    });

    if (ticket.status === TicketStatus.PENDING) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    const savedMessage = await this.messageRepository.save(message);
    await this.logActivity(ticketId, 'Reply sent', 'Agent');

    // Real-time event
    this.supportGateway.emitNewMessage(ticket.id, savedMessage);

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

  async findOneAgentUser(agentId: string) {
    const user = await this.userRepository.findOne({
      where: { id: agentId, role: UserRole.AGENT },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'status',
        'lastActive',
        'permissions',
      ],
    });
    if (!user) throw new NotFoundException('Agent not found');
    return user;
  }

  private async logActivity(ticketId: string, action: string, by: string) {
    const activity = this.activityRepository.create({
      ticketId,
      action,
      by,
    });
    await this.activityRepository.save(activity);
  }

  async findAllAgents(page: number = 1, limit: number = 10, cursor?: string) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.status',
        'user.lastActive',
        'user.createdAt',
      ])
      .where('user.role = :role', { role: UserRole.AGENT });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'user',
    });

    return {
      data: result.data,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: {
        total: result.total,
        page: result.page,
        lastPage: result.meta.lastPage,
      },
    };
  }

  // --- Admin Methods ---

  async findAllAdmin(
    type?: TicketType,
    isAssigned?: boolean,
    page: number = 1,
    limit: number = 10,
    cursor?: string,
  ) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo');

    if (type) {
      qb.andWhere('ticket.type = :type', { type });
    }

    if (isAssigned !== undefined) {
      if (isAssigned) {
        qb.andWhere('ticket.assignedToId IS NOT NULL');
      } else {
        qb.andWhere('ticket.assignedToId IS NULL');
      }
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'ticket',
    });

    return {
      data: result.data,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: {
        total: result.total,
        page: result.page,
        lastPage: result.meta.lastPage,
      },
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

    // Broadcast status update
    this.supportGateway.emitTicketStatusUpdate(id, status);

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
      senderRole: 'AGENT',
      message: messageText,
    });

    if (ticket.status === TicketStatus.PENDING) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepository.save(ticket);
    }

    const savedMessage = await this.messageRepository.save(message);
    await this.logActivity(ticketId, 'Admin Reply sent', 'Admin');

    // Real-time event
    this.supportGateway.emitNewMessage(ticket.id, savedMessage);

    return savedMessage;
  }
}
