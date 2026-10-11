import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { TargetAudience } from './entities/notification-broadcast.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: any;
  let pushService: any;

  beforeEach(async () => {
    notificationsService = {
      sendAdminBroadcast: jest.fn().mockResolvedValue({ id: 'broadcast-1' }),
      getBroadcastHistory: jest.fn().mockResolvedValue({ items: [], meta: {} }),
      getBroadcastById: jest.fn().mockResolvedValue({ id: 'broadcast-1' }),
      getPreferences: jest.fn().mockResolvedValue({ push: true }),
      updatePreferences: jest.fn().mockResolvedValue({ push: true }),
      findByUser: jest.fn().mockResolvedValue([]),
      getUnreadCount: jest.fn().mockResolvedValue(0),
      markAllAsRead: jest.fn().mockResolvedValue({ affected: 1 }),
      markAsRead: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: true }),
    };

    pushService = {
      registerToken: jest.fn().mockResolvedValue({ success: true }),
      clearToken: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PushNotificationService, useValue: pushService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send admin broadcast', async () => {
    const req = { user: { id: 'admin-1' } };
    const dto = {
      title: 'Announcement',
      message: 'System upgrade',
      targetAudience: TargetAudience.BUSINESSES,
    };

    const result = await controller.broadcast(dto, req);
    expect(result).toBeDefined();
    expect(notificationsService.sendAdminBroadcast).toHaveBeenCalledWith(
      'admin-1',
      expect.objectContaining({
        title: 'Announcement',
        targetAudience: TargetAudience.BUSINESSES,
      }),
    );
  });

  it('should get broadcast history', async () => {
    const query = { page: 1, limit: 10, targetAudience: TargetAudience.ALL };
    const result = await controller.getBroadcastHistory(query);
    expect(result).toBeDefined();
    expect(notificationsService.getBroadcastHistory).toHaveBeenCalledWith(
      query,
    );
  });

  it('should get broadcast by ID', async () => {
    const result = await controller.getBroadcastById('broadcast-1');
    expect(result).toBeDefined();
    expect(notificationsService.getBroadcastById).toHaveBeenCalledWith(
      'broadcast-1',
    );
  });

  it('should register push token', async () => {
    const req = { user: { id: 'user-1' } };
    const result = await controller.registerPushToken(
      { token: 'tok-123' },
      req,
    );
    expect(result).toEqual({ success: true });
    expect(pushService.registerToken).toHaveBeenCalledWith(
      'user-1',
      'tok-123',
      true,
      undefined,
      undefined,
    );
  });

  it('should pass the transport and platform through to the registry', async () => {
    const req = { user: { id: 'user-1' } };

    await controller.registerPushToken(
      { token: 'ExponentPushToken[abc]', transport: 'EXPO', platform: 'ios' },
      req,
    );

    expect(pushService.registerToken).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[abc]',
      true,
      'EXPO',
      'ios',
    );
  });

  it('should clear every device when unregistering without a token', async () => {
    const req = { user: { id: 'user-1' } };

    await controller.clearPushToken({}, req);

    expect(pushService.clearToken).toHaveBeenCalledWith(
      'user-1',
      true,
      undefined,
    );
  });

  it('should clear only the named device when a token is given', async () => {
    const req = { user: { id: 'user-1' } };

    await controller.clearPushToken({ token: 'ExponentPushToken[abc]' }, req);

    expect(pushService.clearToken).toHaveBeenCalledWith(
      'user-1',
      true,
      'ExponentPushToken[abc]',
    );
  });

  it('should pass the pagination cursor through to the service', async () => {
    const req = { user: { id: 'user-1' } };
    notificationsService.findByUser.mockResolvedValue([]);

    await controller.findAll(req, { limit: 20, before: '2026-01-01T00:00:00Z' });

    expect(notificationsService.findByUser).toHaveBeenCalledWith('user-1', {
      limit: 20,
      before: new Date('2026-01-01T00:00:00Z'),
    });
  });

  it('should scope markAsRead to the requesting user', async () => {
    const req = { user: { id: 'user-1' } };

    await controller.markAsRead('notif-1', req);

    expect(notificationsService.markAsRead).toHaveBeenCalledWith(
      'notif-1',
      'user-1',
    );
  });
});
