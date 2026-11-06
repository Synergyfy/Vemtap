import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
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
    create: jest.fn((value: Partial<Feedback>) => value),
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
      expect.objectContaining({ stat: expect.anything() as unknown }),
      'new_rating',
    );
  });

  describe('scoping', () => {
    function queryBuilder(rows: unknown[] = []) {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      feedbackRepository.createQueryBuilder.mockReturnValue(qb);
      return qb;
    }

    it('scopes to the business and never includes unbranched rows of others', async () => {
      const qb = queryBuilder([{ id: 'f1', rating: 5 }]);
      await service.getReviews({ businessId: 'biz-1' });
      const [clause, params] = qb.where.mock.calls[0] as [string, object];
      expect(clause).toContain('f.businessId = :businessId');
      expect(clause).not.toContain('f.branchId IS NULL');
      expect(params).toEqual({ businessId: 'biz-1' });
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('narrows to a branch for branch-scoped staff', async () => {
      const qb = queryBuilder();
      await service.getStats({ businessId: 'biz-1', branchId: 'br-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('f.branchId = :branchId', {
        branchId: 'br-1',
      });
    });

    it('returns nothing to a non-admin without a business', async () => {
      const qb = queryBuilder();
      await service.getReviews({ businessId: null });
      expect(qb.where).toHaveBeenCalledWith('1 = 0');
    });

    it('leaves admins unscoped', async () => {
      const qb = queryBuilder();
      await service.getReviews({ isAdmin: true });
      expect(qb.where).not.toHaveBeenCalled();
    });
  });
});
