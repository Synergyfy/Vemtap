import { Test, TestingModule } from '@nestjs/testing';
import { AgentSupportController } from './agent-support.controller';
import { SupportService } from './support.service';
import { TicketStatus, TicketType } from './entities/support-ticket.entity';
import { UserRole } from '../users/entities/user.entity';

describe('AgentSupportController', () => {
  let controller: AgentSupportController;

  const mockSupportService = {
    getAgentStats: jest.fn(),
    findAssigned: jest.fn(),
    findOneAgent: jest.fn(),
    updateStatusAgent: jest.fn(),
    addAgentMessage: jest.fn(),
    updateAgentProfile: jest.fn(),
  };

  const mockAgent = { id: 'agent-1', role: UserRole.AGENT };
  const mockReq = { user: mockAgent };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentSupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    }).compile();

    controller = module.get<AgentSupportController>(AgentSupportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return agent stats', async () => {
      const result = {
        assignedChats: 5,
        openTickets: 10,
        resolvedToday: 2,
        avgResponseTime: '5m',
      };
      mockSupportService.getAgentStats.mockResolvedValue(result);

      expect(await controller.getStats(mockReq as any)).toBe(result);
      expect(mockSupportService.getAgentStats).toHaveBeenCalledWith(
        mockAgent.id,
      );
    });
  });

  describe('getAssignedChats', () => {
    it('should return assigned chats', async () => {
      const result = [{ id: 'chat-1', type: TicketType.CHAT }];
      mockSupportService.findAssigned.mockResolvedValue(result);

      expect(await controller.getAssignedChats(mockReq as any)).toBe(result);
      expect(mockSupportService.findAssigned).toHaveBeenCalledWith(
        mockAgent.id,
        TicketType.CHAT,
        undefined,
        undefined,
      );
    });
  });

  describe('getAssignedTickets', () => {
    it('should return assigned tickets', async () => {
      const result = [{ id: 'ticket-1', type: TicketType.TICKET }];
      mockSupportService.findAssigned.mockResolvedValue(result);

      expect(await controller.getAssignedTickets(mockReq as any)).toBe(result);
      expect(mockSupportService.findAssigned).toHaveBeenCalledWith(
        mockAgent.id,
        TicketType.TICKET,
        undefined,
        undefined,
      );
    });
  });

  describe('getTicketDetails', () => {
    it('should return ticket details', async () => {
      const ticketId = 'ticket-1';
      const result = { id: ticketId };
      mockSupportService.findOneAgent.mockResolvedValue(result);

      expect(await controller.getTicketDetails(ticketId)).toBe(result);
      expect(mockSupportService.findOneAgent).toHaveBeenCalledWith(ticketId);
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      const ticketId = 'ticket-1';
      const dto = { status: TicketStatus.RESOLVED };
      const result = { id: ticketId, status: TicketStatus.RESOLVED };
      mockSupportService.updateStatusAgent.mockResolvedValue(result);

      expect(await controller.updateStatus(mockReq as any, ticketId, dto)).toBe(
        result,
      );
      expect(mockSupportService.updateStatusAgent).toHaveBeenCalledWith(
        ticketId,
        mockAgent.id,
        dto.status,
      );
    });
  });

  describe('addMessage', () => {
    it('should add agent message', async () => {
      const ticketId = 'ticket-1';
      const dto = { message: 'Hello' };
      const result = { id: 'msg-1', message: 'Hello' };
      mockSupportService.addAgentMessage.mockResolvedValue(result);

      expect(await controller.addMessage(mockReq as any, ticketId, dto)).toBe(
        result,
      );
      expect(mockSupportService.addAgentMessage).toHaveBeenCalledWith(
        ticketId,
        mockAgent.id,
        dto.message,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update agent profile', async () => {
      const dto = { firstName: 'New' };
      const result = { id: mockAgent.id, firstName: 'New' };
      mockSupportService.updateAgentProfile.mockResolvedValue(result);

      expect(await controller.updateProfile(mockReq as any, dto)).toBe(result);
      expect(mockSupportService.updateAgentProfile).toHaveBeenCalledWith(
        mockAgent.id,
        dto,
      );
    });
  });
});
