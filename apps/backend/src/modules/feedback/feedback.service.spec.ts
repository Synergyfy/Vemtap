import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { Branch } from '../branches/entities/branch.entity';

describe('FeedbackService', () => {
  let service: FeedbackService;
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
      ],
    }).compile();
    service = module.get(FeedbackService);
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
  });
});
