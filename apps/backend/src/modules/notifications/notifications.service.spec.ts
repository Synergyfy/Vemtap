import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import {
  NotificationBroadcast,
  TargetAudience,
  BroadcastStatus,
} from './entities/notification-broadcast.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotFoundException } from '@nestjs/common';

/** A query-builder double that records the clauses it is told to apply. */
function queryBuilderDouble(rows: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
    getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    getCount: jest.fn().mockResolvedValue(rows.length),
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: any;
  let broadcastRepo: any;
  let userRepo: any;
  let pushService: any;
  let gateway: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Hello',
    isRead: false,
    type: 'info',
    actionUrl: null,
    createdAt: new Date(),
  };

  const mockBroadcast = {
    id: 'broadcast-1',
    senderId: 'admin-1',
    title: 'Holiday Announcement',
    message: 'We are closed on Monday',
    targetAudience: TargetAudience.ALL,
    type: 'announcement',
    actionUrl: '/dashboard',
    channels: ['IN_APP', 'PUSH'],
    totalRecipients: 2,
    pushRecipients: 1,
    status: BroadcastStatus.SENT,
    createdAt: new Date(),
  };

  const mockUsers = [
    {
      id: 'user-1',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      pushToken: '{"endpoint":"https://push.example.com/1"}',
    },
    {
      id: 'user-2',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      pushToken: null,
    },
  ];

  beforeEach(async () => {
    notifRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) => ({ ...dto, id: 'notif-1' })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([mockNotification]),
      findOne: jest.fn().mockResolvedValue(mockNotification),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(5),
      createQueryBuilder: jest.fn(),
    };

    broadcastRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) => ({ ...dto, id: 'broadcast-1' })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      findOne: jest.fn().mockResolvedValue(mockBroadcast),
      createQueryBuilder: jest.fn(),
    };

    userRepo = {
      find: jest.fn().mockResolvedValue(mockUsers),
      findOne: jest.fn().mockResolvedValue(mockUsers[0]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    pushService = {
      sendNotification: jest.fn().mockResolvedValue({ queued: true }),
      registerToken: jest.fn().mockResolvedValue({ success: true }),
    };

    gateway = {
      emitNotificationCreated: jest.fn(),
      emitNotificationsReadAll: jest.fn(),
      emitBroadcastCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notifRepo },
        {
          provide: getRepositoryToken(NotificationBroadcast),
          useValue: broadcastRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PushNotificationService, useValue: pushService },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create & read operations', () => {
    it('should create a notification', async () => {
      const result = await service.create(
        'user-1',
        'Title',
        'Msg',
        'info',
        '/link',
      );
      expect(result).toBeDefined();
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should emit a created notification so live clients see it', async () => {
      const saved = await service.create('user-1', 'Title', 'Msg', 'info');
      expect(gateway.emitNotificationCreated).toHaveBeenCalledWith(
        'user-1',
        saved,
      );
    });

    it('should emit a batched event when many notifications are created', async () => {
      await service.createMany(['user-1', 'user-2'], 'T', 'M', 'new_order');
      expect(notifRepo.save).toHaveBeenCalled();
      expect(gateway.emitBroadcastCreated).toHaveBeenCalledWith(
        ['user-1', 'user-2'],
        2,
      );
    });

    it('should emit nothing when createMany has no recipients', async () => {
      await service.createMany([], 'T', 'M');
      expect(notifRepo.save).not.toHaveBeenCalled();
      expect(gateway.emitBroadcastCreated).not.toHaveBeenCalled();
    });

    it('should de-duplicate recipients in createMany', async () => {
      await service.createMany(['user-1', 'user-1'], 'T', 'M');
      expect(gateway.emitBroadcastCreated).toHaveBeenCalledWith(['user-1'], 1);
    });

    it('should find notifications by user with pagination', async () => {
      const qb = queryBuilderDouble([mockNotification]);
      notifRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('n."userId" = :userId', {
        userId: 'user-1',
      });
      // Ordered on updatedAt, not createdAt: a batch that just took another
      // event must rise to the top rather than sit where it was first written.
      expect(qb.orderBy).toHaveBeenCalledWith('n."updatedAt"', 'DESC');
      // Fetches one extra row to detect whether a next page exists.
      expect(qb.take).toHaveBeenCalledWith(51);
    });

    it('should cap the limit at 200', async () => {
      const qb = queryBuilderDouble([]);
      notifRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findByUser('user-1', { limit: 5000 });

      expect(qb.take).toHaveBeenCalledWith(201);
    });

    it('should apply the before cursor when given a parseable date', async () => {
      const qb = queryBuilderDouble([]);
      notifRepo.createQueryBuilder.mockReturnValue(qb);
      const before = new Date('2026-01-01T00:00:00.000Z');

      await service.findByUser('user-1', { before });

      // The cursor rides the same column the list is ordered on.
      expect(qb.andWhere).toHaveBeenCalledWith('n."updatedAt" < :before', {
        before,
      });
    });

    it('should ignore an unparseable before value', async () => {
      const qb = queryBuilderDouble([]);
      notifRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findByUser('user-1', {
        before: new Date('not-a-date'),
      });

      // No cursor clause — the expiry sweep shares this builder and uses
      // andWhere for its own filter, so this asserts on the cursor clause
      // specifically rather than on the method being untouched.
      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'n."updatedAt" < :before',
        expect.anything(),
      );
    });

    it('should get unread count', async () => {
      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(5);
    });

    it('should mark a notification as read', async () => {
      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result.isRead).toBe(true);
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should scope markAsRead to the owning user', async () => {
      await service.markAsRead('notif-1', 'user-1');

      // Without the userId in the lookup, any user could read anyone's row.
      expect(notifRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });

    it("should throw NotFoundException when marking another user's notification", async () => {
      notifRepo.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead('notif-1', 'some-other-user'),
      ).rejects.toThrow(NotFoundException);
      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('should not re-save a notification that is already read', async () => {
      notifRepo.findOne.mockResolvedValue({ ...mockNotification, isRead: true });

      await service.markAsRead('notif-1', 'user-1');

      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('should emit read-all on markAllAsRead', async () => {
      await service.markAllAsRead('user-1');

      expect(notifRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true },
      );
      expect(gateway.emitNotificationsReadAll).toHaveBeenCalledWith(
        'user-1',
        0,
      );
    });
  });

  describe('staff notifications', () => {
    it('should write one row per staff member of a branch', async () => {
      userRepo.find.mockResolvedValue([{ id: 'staff-1' }, { id: 'owner-1' }]);

      const rows = await service.createForBranchStaff(
        'branch-1',
        'business-1',
        'New Order',
        'An order arrived',
        'new_order',
        '/orders/1',
      );

      expect(rows).toHaveLength(2);
      // Both the direct branch member and anyone attached to the business,
      // because owners and managers often hold no branchId of their own.
      expect(userRepo.find).toHaveBeenCalledWith({
        where: [{ branchId: 'branch-1' }, { businessId: 'business-1' }],
        select: ['id'],
      });
      expect(gateway.emitBroadcastCreated).toHaveBeenCalledWith(
        ['staff-1', 'owner-1'],
        2,
      );
    });

    it('should query only the branch when no businessId is supplied', async () => {
      userRepo.find.mockResolvedValue([{ id: 'staff-1' }]);

      await service.createForBranchStaff('branch-1', null, 'T', 'M');

      expect(userRepo.find).toHaveBeenCalledWith({
        where: [{ branchId: 'branch-1' }],
        select: ['id'],
      });
    });
  });

  describe('sendAdminBroadcast', () => {
    it('should broadcast to ALL users (creating in-app and queuing push)', async () => {
      const result = await service.sendAdminBroadcast('admin-1', {
        title: 'Platform Maintenance',
        message: 'System upgrade scheduled at 2 AM',
        targetAudience: TargetAudience.ALL,
        type: 'announcement',
        actionUrl: '/dashboard/notices',
        sendPush: true,
        sendInApp: true,
      });

      expect(userRepo.find).toHaveBeenCalled();
      expect(notifRepo.save).toHaveBeenCalled();
      // Push should only be sent to users with pushToken (user-1)
      expect(pushService.sendNotification).toHaveBeenCalledTimes(1);
      expect(pushService.sendNotification).toHaveBeenCalledWith(
        'user-1',
        'Platform Maintenance',
        'System upgrade scheduled at 2 AM',
        expect.objectContaining({
          url: '/dashboard/notices',
          type: 'announcement',
          category: 'marketing',
        }),
        true,
      );
      expect(broadcastRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: 'admin-1',
          title: 'Platform Maintenance',
          targetAudience: TargetAudience.ALL,
          totalRecipients: 2,
          pushRecipients: 1,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should broadcast to BUSINESSES only', async () => {
      userRepo.find.mockResolvedValue([mockUsers[0]]); // Owner only

      await service.sendAdminBroadcast('admin-1', {
        title: 'Business Tax Update',
        message: 'New invoicing feature released',
        targetAudience: TargetAudience.BUSINESSES,
        type: 'info',
      });

      expect(userRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: expect.anything(),
          }),
        }),
      );
      expect(notifRepo.save).toHaveBeenCalled();
      expect(broadcastRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAudience: TargetAudience.BUSINESSES,
          totalRecipients: 1,
        }),
      );
    });

    it('should broadcast to CUSTOMERS only', async () => {
      userRepo.find.mockResolvedValue([mockUsers[1]]); // Customer only

      await service.sendAdminBroadcast('admin-1', {
        title: 'Special Weekend Discount',
        message: 'Enjoy 10% off deals near you',
        targetAudience: TargetAudience.CUSTOMERS,
        type: 'promo',
      });

      expect(broadcastRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAudience: TargetAudience.CUSTOMERS,
          totalRecipients: 1,
        }),
      );
    });

    it('should skip push notifications when sendPush is false', async () => {
      await service.sendAdminBroadcast('admin-1', {
        title: 'Silent In-App Notice',
        message: 'Only in app',
        targetAudience: TargetAudience.ALL,
        sendPush: false,
        sendInApp: true,
      });

      expect(notifRepo.save).toHaveBeenCalled();
      expect(pushService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('broadcast history & details', () => {
    it('should return paginated broadcast history', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBroadcast], 1]),
      };
      broadcastRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBroadcastHistory({
        page: 1,
        limit: 10,
        targetAudience: TargetAudience.ALL,
        search: 'Holiday',
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'broadcast.targetAudience = :audience',
        { audience: TargetAudience.ALL },
      );
    });

    it('should get broadcast by ID', async () => {
      const result = await service.getBroadcastById('broadcast-1');
      expect(result).toEqual(mockBroadcast);
    });

    it('should throw NotFoundException if broadcast does not exist', async () => {
      broadcastRepo.findOne.mockResolvedValue(null);
      await expect(service.getBroadcastById('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
