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
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: any;
  let broadcastRepo: any;
  let userRepo: any;
  let pushService: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Hello',
    isRead: false,
    type: 'info',
    actionUrl: null,
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
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'notif-1' })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([mockNotification]),
      findOne: jest.fn().mockResolvedValue(mockNotification),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(5),
      createQueryBuilder: jest.fn(),
    };

    broadcastRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'broadcast-1' })),
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
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create & read operations', () => {
    it('should create a notification', async () => {
      const result = await service.create('user-1', 'Title', 'Msg', 'info', '/link');
      expect(result).toBeDefined();
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should find notifications by user', async () => {
      const result = await service.findByUser('user-1');
      expect(result).toHaveLength(1);
      expect(notifRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should get unread count', async () => {
      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(5);
    });

    it('should mark a notification as read', async () => {
      const result = await service.markAsRead('notif-1');
      expect(result.isRead).toBe(true);
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when marking non-existent notification as read', async () => {
      notifRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark all notifications as read for a user', async () => {
      const result = await service.markAllAsRead('user-1');
      expect(result).toBeDefined();
      expect(notifRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true },
      );
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
