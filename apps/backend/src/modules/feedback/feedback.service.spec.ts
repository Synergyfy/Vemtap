import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { Branch } from '../branches/entities/branch.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let notificationsService: { createForBranchStaff: jest.Mock };
  const feedbackRepository = {
    manager: {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          id: 'branch-1',
          businessId: 'business-1',
        }),
      }),
    },
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ id: 'feedback-1', ...value })),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: feedbackRepository },
        // The service notifies branch staff on a new rating; the real one pulls
        // in the whole notification stack, so this stays a stub.
        {
          provide: NotificationsService,
          useValue: { createForBranchStaff: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();
    service = module.get(FeedbackService);
    notificationsService = module.get(NotificationsService);
  });

  it('persists feedback with the authenticated customer identity', async () => {
    const result = await service.create(
      {
        branchId: 'branch-1',
        rating: 5,
        comment: 'Excellent service',
      },
      {
        id: 'customer-1',
        firstName: 'Amina',
        lastName: 'Bello',
      } as any,
    );

    expect(feedbackRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-1',
        customerName: 'Amina Bello',
        sentiment: 'positive',
      }),
    );
    expect(result.id).toBe('feedback-1');
    // The stable event identity the batching key is built on. The tone differs
    // per star rating, so keying batches on it would never group a rating.
    expect(notificationsService.createForBranchStaff).toHaveBeenCalledWith(
      'branch-1',
      'business-1',
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ stat: expect.anything() }),
      'new_rating',
    );
  });
});
