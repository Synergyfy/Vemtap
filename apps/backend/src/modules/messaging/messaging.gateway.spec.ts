import { Test, TestingModule } from '@nestjs/testing';
import { MessagingGateway } from './messaging.gateway';
import { PresenceService } from './services/presence.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from './entities/message.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { Server, Socket } from 'socket.io';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;
  let jwtService: JwtService;
  let userRepo: any;
  let branchRepo: any;
  let messageRepo: any;
  let threadRepo: any;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  /** A socket whose recorded calls are not shared with any other test. */
  const freshSocket = () =>
    ({
      handshake: { auth: { token: 'valid-token' }, headers: {} },
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      data: {},
    }) as any as Socket;

  const mockSocket = freshSocket();

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    // An owner or manager holds a businessId but no branchId, so the gateway
    // widens their rooms by business and must be able to list its branches.
    branchRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    messageRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    threadRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    mockServer.to.mockClear();
    mockServer.emit.mockClear();

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
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepo,
        },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: getRepositoryToken(ConversationThread), useValue: threadRepo },
        {
          provide: PresenceService,
          useValue: {
            setOnline: jest
              .fn()
              .mockReturnValue({ isOnline: true, lastSeen: '2026-01-01T00:00:00.000Z' }),
            setOffline: jest
              .fn()
              .mockReturnValue({ isOnline: false, lastSeen: '2026-01-01T00:00:00.000Z' }),
            getStatus: jest
              .fn()
              .mockReturnValue({ isOnline: false, lastSeen: null }),
            getStatuses: jest.fn().mockReturnValue({}),
          },
        },
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

    it('should join every branch of the business when the user has no branchId', async () => {
      // An owner or manager heads the business rather than one branch, so
      // their branchId is null. Scoping by business is the only way they see
      // branch-scoped events at all.
      const socket = freshSocket();
      userRepo.findOne.mockResolvedValue({
        id: 'owner-1',
        role: 'Owner',
        branchId: null,
        businessId: 'business-1',
      });
      branchRepo.find.mockResolvedValue([
        { id: 'branch-a' },
        { id: 'branch-b' },
      ]);

      await gateway.handleConnection(socket);

      expect(branchRepo.find).toHaveBeenCalledWith({
        where: { businessId: 'business-1' },
        select: ['id'],
      });
      expect(socket.join).toHaveBeenCalledWith('branch_branch-a');
      expect(socket.join).toHaveBeenCalledWith('branch_branch-b');
    });

    it('should join one room for a branch that is both direct and a sibling', async () => {
      const socket = freshSocket();
      userRepo.findOne.mockResolvedValue({
        id: 'staff-1',
        role: 'Staff',
        branchId: 'branch-a',
        businessId: 'business-1',
      });
      branchRepo.find.mockResolvedValue([{ id: 'branch-a' }]);

      await gateway.handleConnection(socket);

      // De-duplicated by the set, so one room, not two.
      const branchJoins = (socket.join as jest.Mock).mock.calls.filter(
        (c: any[]) => c[0] === 'branch_branch-a',
      );
      expect(branchJoins).toHaveLength(1);
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

  describe('presence', () => {
    it('joins one room per channel and snapshots both kinds on subscribe', async () => {
      const socket = freshSocket();

      const res = await gateway.handlePresenceSubscribe(socket, {
        userIds: ['customer-1', 'customer-1'],
        businessIds: ['business-9'],
      });

      // Duplicated ids collapse to a single room join.
      expect(socket.join).toHaveBeenCalledTimes(2);
      expect(socket.join).toHaveBeenCalledWith('presence:user:customer-1');
      expect(socket.join).toHaveBeenCalledWith('presence:business:business-9');
      expect(res).toEqual({ users: {}, businesses: {} });
    });

    it('leaves the rooms again on unsubscribe', async () => {
      const socket = freshSocket();

      await gateway.handlePresenceUnsubscribe(socket, {
        userIds: ['customer-1'],
        businessIds: ['business-9'],
      });

      expect(socket.leave).toHaveBeenCalledWith('presence:user:customer-1');
      expect(socket.leave).toHaveBeenCalledWith('presence:business:business-9');
    });

    it('returns a plain-object snapshot on presence:get', async () => {
      const res = await gateway.handlePresenceGet({
        userIds: ['customer-1'],
      });

      expect(res).toEqual({ users: {}, businesses: {} });
    });

    it('marks both the user and their business online on connect', async () => {
      const socket = freshSocket();
      userRepo.findOne.mockResolvedValue({
        id: 'staff-1',
        role: 'Staff',
        branchId: 'branch-1',
        businessId: 'business-1',
      });

      await gateway.handleConnection(socket);

      const { presenceService } = gateway as any;
      expect(presenceService.setOnline).toHaveBeenCalledWith(
        'user',
        'staff-1',
        socket.id,
      );
      expect(presenceService.setOnline).toHaveBeenCalledWith(
        'business',
        'business-1',
        socket.id,
      );
      // Announced to subscribers of the channel only, not broadcast.
      expect(mockServer.to).toHaveBeenCalledWith('presence:user:staff-1');
      expect(mockServer.to).toHaveBeenCalledWith(
        'presence:business:business-1',
      );
    });

    it('drops both channels on disconnect', async () => {
      const socket = freshSocket();
      userRepo.findOne.mockResolvedValue({
        id: 'staff-1',
        role: 'Staff',
        branchId: 'branch-1',
        businessId: 'business-1',
      });
      await gateway.handleConnection(socket);
      mockServer.to.mockClear();

      await gateway.handleDisconnect(socket);

      const { presenceService } = gateway as any;
      expect(presenceService.setOffline).toHaveBeenCalledWith(
        'user',
        'staff-1',
        socket.id,
      );
      expect(presenceService.setOffline).toHaveBeenCalledWith(
        'business',
        'business-1',
        socket.id,
      );
      expect(mockServer.to).toHaveBeenCalledWith('presence:user:staff-1');
      expect(mockServer.to).toHaveBeenCalledWith(
        'presence:business:business-1',
      );
    });
  });

  describe('receipts', () => {
    const thread = { id: 'thread-1', branchId: 'branch-1', customerId: 'cust-1' };

    /** A socket already authenticated as `userId` with access to `branchIds`. */
    const partySocket = (userId: string, branchIds?: string[]) => {
      const socket = freshSocket();
      socket.data = { userId, ...(branchIds ? { branchIds } : {}) };
      return socket;
    };

    beforeEach(() => {
      threadRepo.findOne.mockResolvedValue(thread);
    });

    it('lets the customer mark the business replies read, whatever their role', async () => {
      // An owner in the customer shell keeps their owner role; ownership of
      // the thread is what makes them the reader of OUTBOUND messages.
      const socket = partySocket('cust-1', ['other-branch']);
      socket.data.role = 'BusinessOwner';
      messageRepo.find.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);

      await gateway.handleMarkRead(socket, { threadId: 'thread-1' });

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ threadId: 'thread-1', direction: 'OUTBOUND' }),
        }),
      );
      expect(messageRepo.update).toHaveBeenCalledWith(expect.anything(), { status: 'READ' });
      // The business sent these, so its branch room hears about it.
      expect(mockServer.to).toHaveBeenCalledWith(['thread_thread-1', 'branch_branch-1']);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'messageRead',
        expect.objectContaining({ threadId: 'thread-1', messageIds: ['m1', 'm2'], status: 'READ' }),
      );
    });

    it('lets branch staff mark the customer messages read and tells the customer', async () => {
      const socket = partySocket('staff-1', ['branch-1']);
      messageRepo.find.mockResolvedValue([{ id: 'm3' }]);

      await gateway.handleMarkRead(socket, { threadId: 'thread-1' });

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ direction: 'INBOUND' }),
        }),
      );
      expect(mockServer.to).toHaveBeenCalledWith(['thread_thread-1', 'user_cust-1']);
    });

    it('ignores read receipts from a socket that is not a party to the thread', async () => {
      const socket = partySocket('stranger', ['other-branch']);

      await gateway.handleMarkRead(socket, { threadId: 'thread-1' });

      expect(messageRepo.update).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('only advances SENT messages addressed to the acking socket on markDelivered', async () => {
      const socket = partySocket('cust-1');
      messageRepo.find.mockResolvedValue([{ id: 'm1' }]);

      await gateway.handleMarkDelivered(socket, { threadId: 'thread-1', messageId: 'm1' });

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ direction: 'OUTBOUND', status: 'SENT' }),
        }),
      );
      expect(messageRepo.update).toHaveBeenCalledWith(expect.anything(), { status: 'DELIVERED' });
      expect(mockServer.emit).toHaveBeenCalledWith(
        'messageStatus',
        expect.objectContaining({ messageId: 'm1', messageIds: ['m1'], status: 'DELIVERED' }),
      );
    });

    it('does nothing when the sender tries to mark its own message delivered', async () => {
      // The query is scoped to the incoming direction, so the sender's own
      // message never matches.
      const socket = partySocket('cust-1');
      messageRepo.find.mockResolvedValue([]);

      await gateway.handleMarkDelivered(socket, { threadId: 'thread-1', messageId: 'own' });

      expect(messageRepo.update).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalledWith('messageStatus', expect.anything());
    });

    it('marks messages waiting for a user delivered when they connect', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'cust-1', role: 'Customer' });
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'cust-1' } as any);
      messageRepo.find.mockResolvedValue([
        { id: 'm1', threadId: 'thread-1', branchId: 'branch-1', customerId: 'cust-1', direction: 'OUTBOUND' },
        { id: 'm2', threadId: 'thread-1', branchId: 'branch-1', customerId: 'cust-1', direction: 'OUTBOUND' },
      ]);

      await gateway.handleConnection(freshSocket());

      expect(messageRepo.update).toHaveBeenCalledWith(expect.anything(), { status: 'DELIVERED' });
      expect(mockServer.to).toHaveBeenCalledWith(['thread_thread-1', 'branch_branch-1']);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'messageStatus',
        expect.objectContaining({ threadId: 'thread-1', messageIds: ['m1', 'm2'] }),
      );
    });
  });
});
