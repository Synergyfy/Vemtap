import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';

describe('SupportService', () => {
  let service: SupportService;

  const mockTicketRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllAdmin', () => {
    it('should return all tickets with user relation', async () => {
      const tickets = [{ id: '1' }, { id: '2' }];
      mockTicketRepository.find.mockResolvedValue(tickets);

      const result = await service.findAllAdmin();
      expect(result).toEqual(tickets);
      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOneAdmin', () => {
    it('should return a ticket with messages and sender', async () => {
      const ticket = { id: '1', messages: [] };
      mockTicketRepository.findOne.mockResolvedValue(ticket);

      const result = await service.findOneAdmin('1');
      expect(result).toEqual(ticket);
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);
      await expect(service.findOneAdmin('1')).rejects.toThrow(
        'Ticket not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      const ticket = { id: '1', status: TicketStatus.OPEN };
      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockTicketRepository.save.mockResolvedValue({
        ...ticket,
        status: TicketStatus.CLOSED,
      });

      const result = await service.updateStatus('1', TicketStatus.CLOSED);
      expect(result.status).toBe(TicketStatus.CLOSED);
    });
  });

  describe('addAdminMessage', () => {
    it('should add a message and update status to IN_PROGRESS', async () => {
      const ticket = { id: '1', status: TicketStatus.OPEN };
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
