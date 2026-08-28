import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { DealEngagementService } from './deal-engagement.service';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { DealReview, DealReviewStatus } from './entities/deal-review.entity';
import { DealReviewLike } from './entities/deal-review-like.entity';
import {
  DealReaction,
  DealReactionType,
} from './entities/deal-reaction.entity';
import { DealSave } from './entities/deal-save.entity';

describe('DealEngagementService', () => {
  let service: DealEngagementService;
  let manager: Record<string, jest.Mock>;

  const mockOfferRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockReviewRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReviewLikeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockReactionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockSaveRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockCacheManager = {
    del: jest.fn(),
    reset: jest.fn(),
    store: {
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    manager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };
    mockDataSource.transaction.mockImplementation(
      (cb: (m: typeof manager) => unknown) => cb(manager),
    );
    mockCacheManager.store.keys.mockResolvedValue([]);
    mockCacheManager.store.del.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealEngagementService,
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockOfferRepository,
        },
        {
          provide: getRepositoryToken(DealReview),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(DealReviewLike),
          useValue: mockReviewLikeRepository,
        },
        {
          provide: getRepositoryToken(DealReaction),
          useValue: mockReactionRepository,
        },
        { provide: getRepositoryToken(DealSave), useValue: mockSaveRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<DealEngagementService>(DealEngagementService);
  });

  describe('createReview', () => {
    it('throws NotFoundException when the offer does not exist', async () => {
      mockOfferRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createReview(
          undefined,
          'offer-1',
          { comment: 'Nice' },
          '1.2.3.4',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a duplicate review from the same authenticated user', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.findOne.mockResolvedValue({ id: 'review-1' });
      await expect(
        service.createReview(
          { id: 'user-1', firstName: 'Ada', lastName: 'L' },
          'offer-1',
          { comment: 'Nice' },
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { offerId: 'offer-1', userId: 'user-1' },
      });
    });

    it('rejects an anonymous review within the same 24h window per IP', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'review-1' }),
      };
      mockReviewRepository.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.createReview(
          undefined,
          'offer-1',
          { comment: 'Nice', name: 'Guest' },
          '1.2.3.4',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('requires a name when the reviewer is anonymous', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockReviewRepository.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.createReview(
          undefined,
          'offer-1',
          { comment: 'Nice' },
          '1.2.3.4',
        ),
      ).rejects.toThrow('A reviewer name is required');
    });

    it('creates a pending review and returns the submission shape', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.create.mockReturnValue({});
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        status: DealReviewStatus.PENDING,
        createdAt: new Date('2026-08-27T10:00:00.000Z'),
      });

      const result = await service.createReview(
        { id: 'user-1', firstName: 'Ada', lastName: 'L' },
        'offer-1',
        { comment: 'Nice' },
      );

      expect(result).toEqual({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        status: DealReviewStatus.PENDING,
        createdAt: expect.any(Date) as Date,
      });
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('prefers the provided name over the authenticated user name', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.create.mockReturnValue({});
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        reviewerName: 'Chidi O.',
        comment: 'Nice',
        status: DealReviewStatus.PENDING,
        createdAt: new Date(),
      });
      await service.createReview(
        { id: 'user-1', firstName: 'Ada', lastName: 'L' },
        'offer-1',
        { comment: 'Nice', name: 'Chidi O.' },
      );
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ reviewerName: 'Chidi O.' }),
      );
    });
  });

  describe('listReviews', () => {
    it('returns only approved reviews with pagination metadata', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'review-1',
            reviewerName: 'Ada L',
            comment: 'Great',
            likesCount: 2,
            createdAt: new Date(),
          },
        ],
        1,
      ]);
      mockReviewLikeRepository.find.mockResolvedValue([
        { reviewId: 'review-1' },
      ]);

      const result = await service.listReviews(
        'offer-1',
        { page: 1, limit: 10 },
        { id: 'user-1' },
      );

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.reviews[0]).toMatchObject({
        id: 'review-1',
        isLiked: true,
      });
      expect(mockReviewRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { offerId: 'offer-1', status: DealReviewStatus.APPROVED },
        }),
      );
    });

    it('omits isLiked for anonymous callers', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'review-1',
            reviewerName: 'Ada',
            comment: 'Great',
            likesCount: 0,
            createdAt: new Date(),
          },
        ],
        1,
      ]);
      const result = await service.listReviews('offer-1', {}, undefined);
      expect(result.reviews[0]).not.toHaveProperty('isLiked');
    });
  });

  describe('previewReviews', () => {
    it('returns the top 3 approved reviews by likes', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.find.mockResolvedValue([
        {
          id: 'review-1',
          reviewerName: 'A',
          comment: 'x',
          likesCount: 5,
          createdAt: new Date(),
        },
        {
          id: 'review-2',
          reviewerName: 'B',
          comment: 'y',
          likesCount: 3,
          createdAt: new Date(),
        },
        {
          id: 'review-3',
          reviewerName: 'C',
          comment: 'z',
          likesCount: 1,
          createdAt: new Date(),
        },
      ]);
      const result = await service.previewReviews('offer-1');
      expect(result.reviews).toHaveLength(3);
      expect(mockReviewRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
    });
  });

  describe('toggleReviewLike', () => {
    it('removes the like and returns liked:false', async () => {
      manager.findOne
        .mockResolvedValueOnce({
          id: 'review-1',
          offerId: 'offer-1',
          status: DealReviewStatus.APPROVED,
        })
        .mockResolvedValueOnce({ id: 'like-1' });
      manager.count.mockResolvedValue(1);
      const result = await service.toggleReviewLike(
        'user-1',
        'offer-1',
        'review-1',
      );
      expect(result).toEqual({ liked: false, likesCount: 1 });
      expect(manager.remove).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalled();
    });

    it('adds the like and returns liked:true', async () => {
      manager.findOne
        .mockResolvedValueOnce({
          id: 'review-1',
          offerId: 'offer-1',
          status: DealReviewStatus.APPROVED,
        })
        .mockResolvedValueOnce(null);
      manager.count.mockResolvedValue(1);
      const result = await service.toggleReviewLike(
        'user-1',
        'offer-1',
        'review-1',
      );
      expect(result).toEqual({ liked: true, likesCount: 1 });
      expect(manager.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing review', async () => {
      manager.findOne.mockResolvedValueOnce(null);
      await expect(
        service.toggleReviewLike('user-1', 'offer-1', 'review-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a review of another offer', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'review-1',
        offerId: 'other-offer',
        status: DealReviewStatus.APPROVED,
      });
      await expect(
        service.toggleReviewLike('user-1', 'offer-1', 'review-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a non-approved review', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.PENDING,
      });
      await expect(
        service.toggleReviewLike('user-1', 'offer-1', 'review-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setReaction', () => {
    it('creates a new reaction and syncs counts', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      manager.findOne.mockResolvedValue(null);
      manager.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
      const result = await service.setReaction(
        'user-1',
        'offer-1',
        DealReactionType.LIKE,
      );
      expect(result).toEqual({ type: 'like', likesCount: 3, dislikesCount: 1 });
      expect(manager.create).toHaveBeenCalledWith(DealReaction, {
        offerId: 'offer-1',
        userId: 'user-1',
        type: 'like',
      });
    });

    it('toggles off when the same type is sent again', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      manager.findOne.mockResolvedValue({
        id: 'reaction-1',
        type: DealReactionType.LIKE,
      });
      manager.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
      const result = await service.setReaction(
        'user-1',
        'offer-1',
        DealReactionType.LIKE,
      );
      expect(result).toEqual({ type: null, likesCount: 0, dislikesCount: 1 });
      expect(manager.remove).toHaveBeenCalled();
    });

    it('switches type when a different type is sent', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      manager.findOne.mockResolvedValue({
        id: 'reaction-1',
        type: DealReactionType.LIKE,
      });
      manager.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      const result = await service.setReaction(
        'user-1',
        'offer-1',
        DealReactionType.DISLIKE,
      );
      expect(result).toEqual({
        type: 'dislike',
        likesCount: 1,
        dislikesCount: 1,
      });
      expect(manager.update).toHaveBeenCalled();
    });
  });

  describe('getReactionStatus', () => {
    it('returns the reaction type and counts', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        likesCount: 3,
        dislikesCount: 1,
      });
      mockReactionRepository.findOne.mockResolvedValue({
        type: DealReactionType.DISLIKE,
      });
      const result = await service.getReactionStatus('user-1', 'offer-1');
      expect(result).toEqual({
        type: 'dislike',
        likesCount: 3,
        dislikesCount: 1,
      });
    });
  });

  describe('toggleSave', () => {
    it('saves when not already saved', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockSaveRepository.findOne.mockResolvedValue(null);
      mockSaveRepository.create.mockReturnValue({});
      const result = await service.toggleSave('user-1', 'offer-1');
      expect(result).toEqual({ saved: true });
    });

    it('unsaves when already saved', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockSaveRepository.findOne.mockResolvedValue({ id: 'save-1' });
      const result = await service.toggleSave('user-1', 'offer-1');
      expect(result).toEqual({ saved: false });
      expect(mockSaveRepository.remove).toHaveBeenCalled();
    });
  });

  describe('getSaveStatus', () => {
    it('returns isSaved', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockSaveRepository.findOne.mockResolvedValue({ id: 'save-1' });
      await expect(service.getSaveStatus('user-1', 'offer-1')).resolves.toEqual(
        {
          isSaved: true,
        },
      );
    });
  });

  describe('getEngagement', () => {
    it('returns public counts only when anonymous', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
      });
      const result = await service.getEngagement('offer-1', undefined);
      expect(result).toEqual({
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
      });
      expect(result).not.toHaveProperty('type');
    });

    it('includes type and isSaved when authenticated', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
      });
      mockReactionRepository.findOne.mockResolvedValue({
        type: DealReactionType.LIKE,
      });
      mockSaveRepository.findOne.mockResolvedValue({ id: 'save-1' });
      const result = await service.getEngagement('offer-1', { id: 'user-1' });
      expect(result).toEqual({
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
        type: 'like',
        isSaved: true,
      });
    });
  });

  describe('admin moderation', () => {
    it('lists reviews with offer context', async () => {
      mockReviewRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'review-1',
            offerId: 'offer-1',
            offer: { name: 'Summer Deal' },
            reviewerName: 'Ada',
            comment: 'x',
            likesCount: 0,
            status: DealReviewStatus.PENDING,
            userId: 'user-1',
            ipHash: 'abc',
            createdAt: new Date(),
          },
        ],
        1,
      ]);
      const result = await service.findReviewsAdmin(
        DealReviewStatus.PENDING,
        1,
        20,
      );
      expect(result.total).toBe(1);
      expect(result.reviews[0]).toMatchObject({ offerName: 'Summer Deal' });
    });

    it('approves a review and resyncs the offer review count', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.PENDING,
      });
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.APPROVED,
      });
      mockReviewRepository.count.mockResolvedValue(5);
      const result = await service.approveReview('review-1');
      expect(result).toEqual({
        id: 'review-1',
        status: DealReviewStatus.APPROVED,
      });
      expect(mockOfferRepository.update).toHaveBeenCalledWith('offer-1', {
        reviewsCount: 5,
      });
    });

    it('rejects a review', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.PENDING,
      });
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        status: DealReviewStatus.REJECTED,
      });
      mockReviewRepository.count.mockResolvedValue(0);
      const result = await service.rejectReview('review-1');
      expect(result.status).toBe(DealReviewStatus.REJECTED);
    });

    it('soft-deletes a review and resyncs the count', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.APPROVED,
      });
      mockReviewRepository.count.mockResolvedValue(0);
      await service.removeReview('review-1');
      expect(mockReviewRepository.softDelete).toHaveBeenCalledWith('review-1');
      expect(mockOfferRepository.update).toHaveBeenCalledWith('offer-1', {
        reviewsCount: 0,
      });
    });

    it('throws NotFoundException for a missing review', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);
      await expect(service.approveReview('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
