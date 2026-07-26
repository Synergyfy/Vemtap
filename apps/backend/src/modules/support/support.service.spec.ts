import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketActivity } from './entities/ticket-activity.entity';
import { User } from '../users/entities/user.entity';
import { SupportGateway } from './support.gateway';
import { ConversationContextService } from './conversation-context.service';
import { NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;

  const mockTicketRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockActivityRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(TicketMessage),
          useValue: mockMessageRepository,
        },
        {
          provide: getRepositoryToken(TicketActivity),
          useValue: mockActivityRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: SupportGateway,
          useValue: {
            emitTicketUpdate: jest.fn(),
            emitNewMessage: jest.fn(),
            emitTicketStatusUpdate: jest.fn(),
          },
        },
        {
          provide: ConversationContextService,
          useValue: {
            getOrCreateContext: jest.fn().mockResolvedValue({
              id: 'conv-1',
              messages: [],
              context: {},
              userResponses: {},
            }),
            addMessage: jest.fn().mockResolvedValue(undefined),
            addUserResponse: jest.fn().mockResolvedValue(undefined),
            getRecentMessages: jest.fn().mockResolvedValue([]),
            clearContext: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllAdmin', () => {
    it('should return paginated tickets', async () => {
      const tickets = [{ id: '1' }, { id: '2' }];
      mockTicketRepository.findAndCount.mockResolvedValue([tickets, 2]);

      const result = await service.findAllAdmin();
      expect(result.data).toEqual(tickets);
      expect(result.meta.total).toBe(2);
      expect(mockTicketRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOneAdmin', () => {
    it('should return a ticket with relations', async () => {
      const ticket = { id: '1', messages: [] };
      mockTicketRepository.findOne.mockResolvedValue(ticket);

      const result = await service.findOneAdmin('1');
      expect(result).toEqual(ticket);
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);
      await expect(service.findOneAdmin('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      const ticket = { id: '1', status: TicketStatus.PENDING };
      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockTicketRepository.save.mockResolvedValue({
        ...ticket,
        status: TicketStatus.RESOLVED,
      });

      const result = await service.updateStatus('1', TicketStatus.RESOLVED);
      expect(result.status).toBe(TicketStatus.RESOLVED);
    });
  });

  describe('addAdminMessage', () => {
    it('should add a message and update status to IN_PROGRESS', async () => {
      const ticket = { id: '1', status: TicketStatus.PENDING };
      const message = { id: 'm1', message: 'Hello' };

      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockMessageRepository.create.mockReturnValue(message);
      mockMessageRepository.save.mockResolvedValue(message);

      const result = await service.addAdminMessage('1', 'admin1', 'Hello');
      expect(result).toEqual(message);
      expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });
  });
});
