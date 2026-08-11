import { Test, TestingModule } from '@nestjs/testing';
import { MessagingGateway } from './messaging.gateway';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { Server, Socket } from 'socket.io';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;
  let jwtService: JwtService;
  let userRepo: any;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockSocket = {
    handshake: {
      auth: { token: 'valid-token' },
      headers: {},
    },
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    data: {},
  } as any as Socket;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        { provide: getRepositoryToken(Message), useValue: {} },
        { provide: getRepositoryToken(ConversationThread), useValue: {} },
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    gateway.server = mockServer as any as Server;
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate and join rooms on connection', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        role: 'Customer',
        branchId: 'branch-1',
      });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockSocket.join).toHaveBeenCalledWith('user_user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('branch_branch-1');
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('should disconnect if no token is provided', async () => {
      const socketWithoutToken = {
        handshake: { auth: {}, headers: {} },
        disconnect: jest.fn(),
      } as any as Socket;

      await gateway.handleConnection(socketWithoutToken);

      expect(socketWithoutToken.disconnect).toHaveBeenCalled();
    });
  });

  describe('emitMessage', () => {
    it('should emit newMessage and inboxUpdate events', () => {
      const message = { id: 'msg-1', content: 'hello', direction: 'outbound' };

      gateway.emitMessage('thread-1', 'branch-1', 'user-1', message);

      expect(mockServer.to).toHaveBeenCalledWith('thread_thread-1');
      expect(mockServer.to).toHaveBeenCalledWith('branch_branch-1');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', message);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'inboxUpdate',
        expect.any(Object),
      );
    });

    it('should emit notification for outbound message to customer', () => {
      const message = { id: 'msg-1', content: 'hello', direction: 'outbound' };

      gateway.emitMessage('thread-1', 'branch-1', 'user-1', message);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'new_message',
          threadId: 'thread-1',
        }),
      );
    });

    it('should emit notification for inbound message to staff', () => {
      const message = { id: 'msg-1', content: 'hello', direction: 'inbound' };

      gateway.emitMessage('thread-1', 'branch-1', 'user-1', message);

      expect(mockServer.to).toHaveBeenCalledWith('branch_branch-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'new_message',
          threadId: 'thread-1',
        }),
      );
    });
  });

  describe('SubscribeMessages', () => {
    it('should join thread room on joinThread', () => {
      const res = gateway.handleJoinThread(mockSocket, {
        threadId: 'thread-1',
      });
      expect(mockSocket.join).toHaveBeenCalledWith('thread_thread-1');
      expect(res.status).toBe('joined');
    });

    it('should leave thread room on leaveThread', () => {
      const res = gateway.handleLeaveThread(mockSocket, {
        threadId: 'thread-1',
      });
      expect(mockSocket.leave).toHaveBeenCalledWith('thread_thread-1');
      expect(res.status).toBe('left');
    });

    it('should broadcast typing status', () => {
      mockSocket.data = { userId: 'user-1' };
      gateway.handleTyping(mockSocket, {
        threadId: 'thread-1',
        isTyping: true,
      });
      expect(mockSocket.to).toHaveBeenCalledWith('thread_thread-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('userTyping', {
        userId: 'user-1',
        threadId: 'thread-1',
        isTyping: true,
      });
    });
  });
});
