import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

describe('SupportController', () => {
  let controller: SupportController;
  let service: SupportService;

  const mockSupportService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    addMessage: jest.fn(),
  };

  const mockUser = { id: 'user-1' };
  const mockReq = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create a ticket', async () => {
      const dto: CreateTicketDto = {
        subject: 'Test Ticket',
        category: 'General',
        message: 'Hello',
      };
      const result = { id: 'ticket-1', ...dto };
      mockSupportService.create.mockResolvedValue(result);

      expect(await controller.createTicket(mockReq, dto)).toBe(result);
      expect(mockSupportService.create).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getTickets', () => {
    it('should return all tickets', async () => {
      const result = [{ id: 'ticket-1' }];
      mockSupportService.findAll.mockResolvedValue(result);

      expect(await controller.getTickets(mockReq)).toBe(result);
      expect(mockSupportService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getTicket', () => {
    it('should return ticket details', async () => {
      const ticketId = 'ticket-1';
      const result = { id: ticketId };
      mockSupportService.findOne.mockResolvedValue(result);

      expect(await controller.getTicket(mockReq, ticketId)).toBe(result);
      expect(mockSupportService.findOne).toHaveBeenCalledWith(ticketId, mockUser.id);
    });
  });

  describe('addMessage', () => {
    it('should add a message to ticket', async () => {
      const ticketId = 'ticket-1';
      const message = 'Reply';
      const result = { id: 'msg-1', message };
      mockSupportService.addMessage.mockResolvedValue(result);

      expect(await controller.addMessage(mockReq, ticketId, message)).toBe(result);
      expect(mockSupportService.addMessage).toHaveBeenCalledWith(
        ticketId,
        mockUser.id,
        message,
      );
    });
  });
});
