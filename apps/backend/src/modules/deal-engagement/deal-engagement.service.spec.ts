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

    const defaultQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getRawOne: jest.fn().mockResolvedValue({ avg: '4.50' }),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    mockReviewRepository.createQueryBuilder.mockReturnValue(defaultQb);

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

    it('creates an auto-approved review by default and returns rating and status', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        business: { requireReviewApproval: false },
      });
      mockReviewRepository.create.mockReturnValue({});
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        rating: 5,
        status: DealReviewStatus.APPROVED,
        createdAt: new Date('2026-08-27T10:00:00.000Z'),
      });
      mockReviewRepository.count.mockResolvedValue(1);

      const result = await service.createReview(
        { id: 'user-1', firstName: 'Ada', lastName: 'L' },
        'offer-1',
        { comment: 'Nice', rating: 5 },
      );

      expect(result).toEqual({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        rating: 5,
        status: DealReviewStatus.APPROVED,
        createdAt: expect.any(Date) as Date,
      });
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
          status: DealReviewStatus.APPROVED,
        }),
      );
      expect(mockOfferRepository.update).toHaveBeenCalledWith('offer-1', {
        reviewsCount: 1,
      });
    });

    it('creates a pending review when business moderation is enabled', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        business: { requireReviewApproval: true },
      });
      mockReviewRepository.create.mockReturnValue({});
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        rating: 4,
        status: DealReviewStatus.PENDING,
        createdAt: new Date('2026-08-27T10:00:00.000Z'),
      });

      const result = await service.createReview(
        { id: 'user-1', firstName: 'Ada', lastName: 'L' },
        'offer-1',
        { comment: 'Nice', rating: 4 },
      );

      expect(result).toEqual({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Nice',
        rating: 4,
        status: DealReviewStatus.PENDING,
        createdAt: expect.any(Date) as Date,
      });
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 4,
          status: DealReviewStatus.PENDING,
        }),
      );
    });

    it('prefers the provided name over the authenticated user name', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.create.mockReturnValue({});
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        reviewerName: 'Chidi O.',
        comment: 'Nice',
        rating: null,
        status: DealReviewStatus.APPROVED,
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
    it('returns only approved reviews with pagination metadata and rating', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'review-1',
            reviewerName: 'Ada L',
            comment: 'Great',
            rating: 5,
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
      expect(result.reviews[0]).toMatchObject({
        id: 'review-1',
        reviewerName: 'Ada L',
        comment: 'Great',
        rating: 5,
        likesCount: 2,
        isLiked: true,
      });
    });
  });

  describe('previewReviews', () => {
    it('returns up to 3 approved reviews ordered by likes and recency with rating', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockReviewRepository.find.mockResolvedValue([
        {
          id: 'r1',
          reviewerName: 'Ada',
          comment: 'top',
          rating: 4,
          likesCount: 10,
          createdAt: new Date(),
        },
      ]);
      const result = await service.previewReviews('offer-1');
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0]).toMatchObject({
        id: 'r1',
        reviewerName: 'Ada',
        rating: 4,
      });
    });
  });

  describe('toggleReviewLike', () => {
    it('throws NotFoundException when review does not belong to the offer', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'review-1',
        offerId: 'other-offer',
        status: DealReviewStatus.APPROVED,
      });
      await expect(
        service.toggleReviewLike('user-1', 'offer-1', 'review-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('toggles a like on when none existed and updates count', async () => {
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

    it('toggles a like off when one already existed', async () => {
      const existing = { id: 'like-1', reviewId: 'review-1', userId: 'user-1' };
      manager.findOne
        .mockResolvedValueOnce({
          id: 'review-1',
          offerId: 'offer-1',
          status: DealReviewStatus.APPROVED,
        })
        .mockResolvedValueOnce(existing);
      manager.count.mockResolvedValue(0);

      const result = await service.toggleReviewLike(
        'user-1',
        'offer-1',
        'review-1',
      );
      expect(result).toEqual({ liked: false, likesCount: 0 });
      expect(manager.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('reactions', () => {
    it('sets a new reaction and recalculates offer counters', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        branchId: 'b-1',
      });
      manager.findOne.mockResolvedValue(null);
      manager.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      const result = await service.setReaction(
        'user-1',
        'offer-1',
        DealReactionType.LIKE,
      );
      expect(result).toEqual({
        type: DealReactionType.LIKE,
        likesCount: 1,
        dislikesCount: 0,
      });
      expect(manager.update).toHaveBeenCalledWith(
        CatalogueOffer,
        { id: 'offer-1' },
        { likesCount: 1, dislikesCount: 0 },
      );
    });
  });

  describe('saves', () => {
    it('toggles a save on', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      mockSaveRepository.findOne.mockResolvedValue(null);
      const result = await service.toggleSave('user-1', 'offer-1');
      expect(result).toEqual({ saved: true });
      expect(mockSaveRepository.save).toHaveBeenCalled();
    });

    it('toggles a save off', async () => {
      mockOfferRepository.findOne.mockResolvedValue({ id: 'offer-1' });
      const existing = { id: 'save-1' };
      mockSaveRepository.findOne.mockResolvedValue(existing);
      const result = await service.toggleSave('user-1', 'offer-1');
      expect(result).toEqual({ saved: false });
      expect(mockSaveRepository.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('getEngagement', () => {
    it('returns aggregate counts including averageRating', async () => {
      mockOfferRepository.findOne.mockResolvedValue({
        id: 'offer-1',
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
        averageRating: 4.8,
      });
      const result = await service.getEngagement('offer-1', undefined);
      expect(result).toEqual({
        likesCount: 3,
        dislikesCount: 1,
        reviewsCount: 7,
        averageRating: 4.8,
      });
      expect(result).not.toHaveProperty('type');
    });
  });

  describe('business review moderation', () => {
    it('finds reviews for a business', async () => {
      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'review-1',
              offerId: 'offer-1',
              offer: { name: 'Burger Deal' },
              reviewerName: 'Ada',
              comment: 'Great',
              rating: 5,
              likesCount: 0,
              status: DealReviewStatus.PENDING,
              createdAt: new Date(),
            },
          ],
          1,
        ]),
      };
      mockReviewRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findReviewsForBusiness('biz-1', {
        status: DealReviewStatus.PENDING,
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.reviews[0]).toMatchObject({
        id: 'review-1',
        offerName: 'Burger Deal',
        rating: 5,
      });
    });

    it('approves a review by business owner', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        offer: { id: 'offer-1', businessId: 'biz-1', branchId: 'b-1' },
        status: DealReviewStatus.PENDING,
      });
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.APPROVED,
      });
      mockReviewRepository.count.mockResolvedValue(3);

      const result = await service.approveReviewByBusiness('biz-1', 'review-1');
      expect(result.status).toBe(DealReviewStatus.APPROVED);
      expect(mockOfferRepository.update).toHaveBeenCalledWith('offer-1', {
        reviewsCount: 3,
      });
    });

    it('rejects a review by business owner', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        offer: { id: 'offer-1', businessId: 'biz-1' },
        status: DealReviewStatus.PENDING,
      });
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        status: DealReviewStatus.REJECTED,
      });

      const result = await service.rejectReviewByBusiness('biz-1', 'review-1');
      expect(result.status).toBe(DealReviewStatus.REJECTED);
    });

    it('throws NotFoundException if review does not belong to the business', async () => {
      mockReviewRepository.findOne.mockResolvedValue({
        id: 'review-1',
        offerId: 'offer-1',
        offer: { id: 'offer-1', businessId: 'other-biz' },
      });
      await expect(
        service.approveReviewByBusiness('biz-1', 'review-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('admin moderation', () => {
    it('lists reviews with offer context and rating', async () => {
      mockReviewRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'review-1',
            offerId: 'offer-1',
            offer: { name: 'Summer Deal' },
            reviewerName: 'Ada',
            comment: 'x',
            rating: 4,
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
      expect(result.reviews[0]).toMatchObject({
        offerName: 'Summer Deal',
        rating: 4,
      });
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
