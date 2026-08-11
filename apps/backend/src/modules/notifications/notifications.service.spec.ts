import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Hello',
    isRead: false,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockNotification),
    save: jest.fn().mockResolvedValue(mockNotification),
    find: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepository },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn(), findOne: jest.fn(), update: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(getRepositoryToken(Notification));
  });

  it('should create a notification', async () => {
    const result = await service.create('user-1', 'Title', 'Msg');
    expect(result).toEqual(mockNotification);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should find notifications by user', async () => {
    mockRepository.find.mockResolvedValue([mockNotification]);
    const result = await service.findByUser('user-1');
    expect(result).toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('should get unread count', async () => {
    mockRepository.count.mockResolvedValue(5);
    const result = await service.getUnreadCount('user-1');
    expect(result).toBe(5);
  });
});
