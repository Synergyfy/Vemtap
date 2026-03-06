import { Test, TestingModule } from '@nestjs/testing';
import { AgentSupportController } from './agent-support.controller';
import { SupportService } from './support.service';
import { TicketStatus, TicketType } from './entities/support-ticket.entity';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketReplyDto } from './dto/ticket-reply.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

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

  const mockAgent = { id: 'agent-1' };
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

      expect(await controller.getStats(mockReq)).toBe(result);
      expect(mockSupportService.getAgentStats).toHaveBeenCalledWith(
        mockAgent.id,
      );
    });
  });

  describe('getAssignedChats', () => {
    it('should return assigned chats', async () => {
      const result = [{ id: 'chat-1', type: TicketType.CHAT }];
      mockSupportService.findAssigned.mockResolvedValue(result);

      expect(await controller.getAssignedChats(mockReq)).toBe(result);
      expect(mockSupportService.findAssigned).toHaveBeenCalledWith(
        mockAgent.id,
        TicketType.CHAT,
      );
    });
  });

  describe('getAssignedTickets', () => {
    it('should return assigned tickets', async () => {
      const result = [{ id: 'ticket-1', type: TicketType.TICKET }];
      mockSupportService.findAssigned.mockResolvedValue(result);

      expect(await controller.getAssignedTickets(mockReq)).toBe(result);
      expect(mockSupportService.findAssigned).toHaveBeenCalledWith(
        mockAgent.id,
        TicketType.TICKET,
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
      const dto: UpdateTicketStatusDto = { status: TicketStatus.RESOLVED };
      const result = { id: ticketId, status: TicketStatus.RESOLVED };
      mockSupportService.updateStatusAgent.mockResolvedValue(result);

      expect(await controller.updateStatus(mockReq, ticketId, dto)).toBe(
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
      const dto: TicketReplyDto = { message: 'Hello' };
      const result = { id: 'msg-1', message: 'Hello' };
      mockSupportService.addAgentMessage.mockResolvedValue(result);

      expect(await controller.addMessage(mockReq, ticketId, dto)).toBe(result);
      expect(mockSupportService.addAgentMessage).toHaveBeenCalledWith(
        ticketId,
        mockAgent.id,
        dto.message,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update agent profile', async () => {
      const dto: UpdateAgentProfileDto = { firstName: 'New' };
      const result = { id: mockAgent.id, firstName: 'New' };
      mockSupportService.updateAgentProfile.mockResolvedValue(result);

      expect(await controller.updateProfile(mockReq, dto)).toBe(result);
      expect(mockSupportService.updateAgentProfile).toHaveBeenCalledWith(
        mockAgent.id,
        dto,
      );
    });
  });
});
