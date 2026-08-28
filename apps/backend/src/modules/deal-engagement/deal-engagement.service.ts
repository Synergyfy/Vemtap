import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { createHmac } from 'crypto';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { DealReview, DealReviewStatus } from './entities/deal-review.entity';
import { DealReviewLike } from './entities/deal-review-like.entity';
import {
  DealReaction,
  DealReactionType,
} from './entities/deal-reaction.entity';
import { DealSave } from './entities/deal-save.entity';
import {
  BusinessReviewsQueryDto,
  CreateDealReviewDto,
  ListReviewsQueryDto,
} from './dto/deal-review.dto';

@Injectable()
export class DealEngagementService {
  private readonly logger = new Logger(DealEngagementService.name);

  constructor(
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(DealReview)
    private readonly reviewRepository: Repository<DealReview>,
    @InjectRepository(DealReviewLike)
    private readonly reviewLikeRepository: Repository<DealReviewLike>,
    @InjectRepository(DealReaction)
    private readonly reactionRepository: Repository<DealReaction>,
    @InjectRepository(DealSave)
    private readonly saveRepository: Repository<DealSave>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // --- Helpers ---

  private async getOfferOrThrow(offerId: string): Promise<CatalogueOffer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['business'],
    });
    if (!offer) throw new NotFoundException('Deal not found');
    return offer;
  }

  private hashIp(ip: string): string {
    const secret =
      this.configService.get<string>('IP_HASH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    return createHmac('sha256', secret ?? '')
      .update(ip)
      .digest('hex');
  }

  /**
   * Invalidate the cached public offer payloads (detail + branch feed) that
   * spread the offer entity and therefore carry the denormalized engagement
   * counters. Mirrors CatalogueOfferService.clearCache key enumeration.
   */
  private async clearOfferCaches(
    offerId: string,
    branchId?: string,
  ): Promise<void> {
    try {
      const cacheMgr = this.cacheManager as unknown as {
        store?: {
          keys?: (p: string) => Promise<string[]>;
          del?: (k: string) => Promise<void>;
        };
        reset?: () => Promise<void>;
      };
      const store = cacheMgr.store;
      if (store && typeof store.keys === 'function') {
        const detailKeys = await store.keys(
          `*offers:public:details:${offerId}*`,
        );
        for (const key of detailKeys) {
          if (typeof store.del === 'function') await store.del(key);
          else await this.cacheManager.del(key);
        }
        if (branchId) {
          const branchKeys = await store.keys(
            `*offers:public:branch:${branchId}*`,
          );
          for (const key of branchKeys) {
            if (typeof store.del === 'function') await store.del(key);
            else await this.cacheManager.del(key);
          }
        }
      } else if (typeof cacheMgr.reset === 'function') {
        await cacheMgr.reset();
      }
    } catch (error) {
      this.logger.error(
        `Failed to clear deal engagement cache: ${(error as Error).message}`,
      );
    }
  }

  private async syncReviewLikeCount(
    manager: EntityManager,
    reviewId: string,
  ): Promise<number> {
    const likes = await manager.count(DealReviewLike, { where: { reviewId } });
    await manager.update(DealReview, { id: reviewId }, { likesCount: likes });
    return likes;
  }

  private async syncReactionCounts(
    manager: EntityManager,
    offerId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    const likesCount = await manager.count(DealReaction, {
      where: { offerId, type: DealReactionType.LIKE },
    });
    const dislikesCount = await manager.count(DealReaction, {
      where: { offerId, type: DealReactionType.DISLIKE },
    });
    await manager.update(
      CatalogueOffer,
      { id: offerId },
      { likesCount, dislikesCount },
    );
    return { likesCount, dislikesCount };
  }

  private async syncReviewsCount(offerId: string): Promise<number> {
    const count = await this.reviewRepository.count({
      where: { offerId, status: DealReviewStatus.APPROVED },
    });
    await this.offerRepository.update(offerId, { reviewsCount: count });
    return count;
  }

  private async syncAverageRating(offerId: string): Promise<number | null> {
    const raw = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.offerId = :offerId', { offerId })
      .andWhere('review.status = :status', {
        status: DealReviewStatus.APPROVED,
      })
      .andWhere('review.rating IS NOT NULL')
      .getRawOne<{ avg: string | null }>();

    const avg =
      raw?.avg != null ? parseFloat(Number(raw.avg).toFixed(2)) : null;
    await this.offerRepository.update(offerId, { averageRating: avg });
    return avg;
  }

  // --- Reviews ---

  async createReview(
    user: { id: string; firstName?: string; lastName?: string } | undefined,
    offerId: string,
    dto: CreateDealReviewDto,
    ip?: string,
  ) {
    const offer = await this.getOfferOrThrow(offerId);

    const reviewerName =
      dto.name?.trim() ||
      (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
    if (!reviewerName) {
      throw new BadRequestException('A reviewer name is required');
    }

    let ipHash: string | null = null;
    if (user?.id) {
      const existing = await this.reviewRepository.findOne({
        where: { offerId, userId: user.id },
      });
      if (existing) {
        throw new ConflictException('You have already reviewed this deal');
      }
    } else {
      if (!ip) {
        throw new BadRequestException('Unable to determine request origin');
      }
      ipHash = this.hashIp(ip);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await this.reviewRepository
        .createQueryBuilder('review')
        .where('review.offerId = :offerId', { offerId })
        .andWhere('review.ipHash = :ipHash', { ipHash })
        .andWhere('review.createdAt >= :since', { since })
        .getOne();
      if (existing) {
        throw new ConflictException(
          'A review from this device was already submitted in the last 24 hours',
        );
      }
    }

    // Auto-approve reviews unless the business has enabled moderation
    const requireApproval = Boolean(offer.business?.requireReviewApproval);
    const initialStatus = requireApproval
      ? DealReviewStatus.PENDING
      : DealReviewStatus.APPROVED;

    const review = this.reviewRepository.create({
      offerId,
      userId: user?.id ?? null,
      ipHash,
      reviewerName,
      comment: dto.comment,
      rating: dto.rating ?? null,
      status: initialStatus,
    });
    const saved = await this.reviewRepository.save(review);

    if (initialStatus === DealReviewStatus.APPROVED) {
      await this.syncReviewsCount(offerId);
      await this.syncAverageRating(offerId);
      await this.clearOfferCaches(offer.id, offer.branchId);
    }

    return {
      id: saved.id,
      reviewerName: saved.reviewerName,
      comment: saved.comment,
      rating: saved.rating,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async listReviews(
    offerId: string,
    query: ListReviewsQueryDto,
    user?: { id: string },
  ) {
    await this.getOfferOrThrow(offerId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { offerId, status: DealReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    let likedIds = new Set<string>();
    if (user?.id && data.length > 0) {
      const likes = await this.reviewLikeRepository.find({
        where: { userId: user.id, reviewId: In(data.map((r) => r.id)) },
      });
      likedIds = new Set(likes.map((l) => l.reviewId));
    }

    return {
      reviews: data.map((r) => ({
        id: r.id,
        reviewerName: r.reviewerName,
        comment: r.comment,
        rating: r.rating,
        likesCount: r.likesCount,
        createdAt: r.createdAt,
        ...(user?.id ? { isLiked: likedIds.has(r.id) } : {}),
      })),
      total,
      page,
    };
  }

  async previewReviews(offerId: string) {
    await this.getOfferOrThrow(offerId);
    const data = await this.reviewRepository.find({
      where: { offerId, status: DealReviewStatus.APPROVED },
      order: { likesCount: 'DESC', createdAt: 'DESC' },
      take: 3,
    });
    return {
      reviews: data.map((r) => ({
        id: r.id,
        reviewerName: r.reviewerName,
        comment: r.comment,
        rating: r.rating,
        likesCount: r.likesCount,
        createdAt: r.createdAt,
      })),
    };
  }

  async toggleReviewLike(userId: string, offerId: string, reviewId: string) {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(DealReview, {
        where: { id: reviewId },
      });
      // Do not reveal the existence of reviews that are not publicly visible
      // or that belong to a different offer than the one in the path.
      if (
        !review ||
        review.offerId !== offerId ||
        review.status !== DealReviewStatus.APPROVED
      ) {
        throw new NotFoundException('Review not found');
      }

      const existing = await manager.findOne(DealReviewLike, {
        where: { reviewId, userId },
      });

      if (existing) {
        await manager.remove(existing);
      } else {
        await manager.save(
          manager.create(DealReviewLike, { reviewId, userId }),
        );
      }

      const likesCount = await this.syncReviewLikeCount(manager, reviewId);
      return { liked: !existing, likesCount };
    });
  }

  // --- Reactions ---

  async setReaction(userId: string, offerId: string, type: DealReactionType) {
    const offer = await this.getOfferOrThrow(offerId);
    const result = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(DealReaction, {
        where: { offerId, userId },
      });

      if (!existing) {
        await manager.save(
          manager.create(DealReaction, { offerId, userId, type }),
        );
      } else if (existing.type === type) {
        await manager.remove(existing);
      } else {
        await manager.update(DealReaction, { id: existing.id }, { type });
      }

      const counts = await this.syncReactionCounts(manager, offerId);
      return {
        type: existing?.type === type ? null : type,
        likesCount: counts.likesCount,
        dislikesCount: counts.dislikesCount,
      };
    });
    await this.clearOfferCaches(offer.id, offer.branchId);
    return result;
  }

  async getReactionStatus(userId: string, offerId: string) {
    const offer = await this.getOfferOrThrow(offerId);
    const reaction = await this.reactionRepository.findOne({
      where: { offerId, userId },
    });
    return {
      type: reaction?.type ?? null,
      likesCount: Number(offer.likesCount || 0),
      dislikesCount: Number(offer.dislikesCount || 0),
    };
  }

  // --- Saves ---

  async toggleSave(userId: string, offerId: string) {
    await this.getOfferOrThrow(offerId);
    const existing = await this.saveRepository.findOne({
      where: { offerId, userId },
    });
    if (existing) {
      await this.saveRepository.remove(existing);
      return { saved: false };
    }
    await this.saveRepository.save(
      this.saveRepository.create({ offerId, userId }),
    );
    return { saved: true };
  }

  async getSaveStatus(userId: string, offerId: string) {
    await this.getOfferOrThrow(offerId);
    const existing = await this.saveRepository.findOne({
      where: { offerId, userId },
    });
    return { isSaved: !!existing };
  }

  // --- Engagement summary ---

  async getEngagement(offerId: string, user?: { id: string }) {
    const offer = await this.getOfferOrThrow(offerId);
    const result: Record<string, unknown> = {
      likesCount: Number(offer.likesCount || 0),
      dislikesCount: Number(offer.dislikesCount || 0),
      reviewsCount: Number(offer.reviewsCount || 0),
      averageRating:
        offer.averageRating != null ? Number(offer.averageRating) : null,
    };
    if (user?.id) {
      const reaction = await this.reactionRepository.findOne({
        where: { offerId, userId: user.id },
      });
      result.type = reaction?.type ?? null;
      result.isSaved = !!(await this.saveRepository.findOne({
        where: { offerId, userId: user.id },
      }));
    }
    return result;
  }

  // --- Business review management ---

  async findReviewsForBusiness(
    businessId: string,
    query: BusinessReviewsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.offer', 'offer')
      .where('offer.businessId = :businessId', { businessId })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('review.status = :status', { status: query.status });
    }

    if (query.offerId) {
      qb.andWhere('review.offerId = :offerId', { offerId: query.offerId });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      reviews: data.map((r) => ({
        id: r.id,
        offerId: r.offerId,
        offerName: r.offer?.name,
        reviewerName: r.reviewerName,
        comment: r.comment,
        rating: r.rating,
        likesCount: r.likesCount,
        status: r.status,
        userId: r.userId,
        ipHash: r.ipHash,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async approveReviewByBusiness(businessId: string, reviewId: string) {
    return this.setReviewStatusForBusiness(
      businessId,
      reviewId,
      DealReviewStatus.APPROVED,
    );
  }

  async rejectReviewByBusiness(businessId: string, reviewId: string) {
    return this.setReviewStatusForBusiness(
      businessId,
      reviewId,
      DealReviewStatus.REJECTED,
    );
  }

  async setReviewStatusForBusiness(
    businessId: string,
    reviewId: string,
    status: DealReviewStatus,
  ) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['offer'],
    });
    if (!review || review.offer?.businessId !== businessId) {
      throw new NotFoundException('Review not found');
    }
    review.status = status;
    await this.reviewRepository.save(review);
    await this.syncReviewsCount(review.offerId);
    await this.syncAverageRating(review.offerId);
    if (review.offer) {
      await this.clearOfferCaches(review.offer.id, review.offer.branchId);
    }
    return { id: review.id, status: review.status };
  }

  async removeReviewByBusiness(businessId: string, reviewId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['offer'],
    });
    if (!review || review.offer?.businessId !== businessId) {
      throw new NotFoundException('Review not found');
    }
    await this.reviewRepository.softDelete(reviewId);
    await this.syncReviewsCount(review.offerId);
    await this.syncAverageRating(review.offerId);
    if (review.offer) {
      await this.clearOfferCaches(review.offer.id, review.offer.branchId);
    }
  }

  // --- Admin moderation ---

  async findReviewsAdmin(status?: DealReviewStatus, page = 1, limit = 20) {
    const where: FindOptionsWhere<DealReview> = {};
    if (status) where.status = status;
    const [data, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['offer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      reviews: data.map((r) => ({
        id: r.id,
        offerId: r.offerId,
        offerName: r.offer?.name,
        reviewerName: r.reviewerName,
        comment: r.comment,
        rating: r.rating,
        likesCount: r.likesCount,
        status: r.status,
        userId: r.userId,
        ipHash: r.ipHash,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async approveReview(id: string) {
    return this.setReviewStatus(id, DealReviewStatus.APPROVED);
  }

  async rejectReview(id: string) {
    return this.setReviewStatus(id, DealReviewStatus.REJECTED);
  }

  async setReviewStatus(id: string, status: DealReviewStatus) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    await this.reviewRepository.save(review);
    await this.syncReviewsCount(review.offerId);
    await this.syncAverageRating(review.offerId);
    const offer = await this.offerRepository.findOne({
      where: { id: review.offerId },
    });
    if (offer) await this.clearOfferCaches(offer.id, offer.branchId);
    return { id: review.id, status: review.status };
  }

  async removeReview(id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepository.softDelete(id);
    await this.syncReviewsCount(review.offerId);
    await this.syncAverageRating(review.offerId);
    const offer = await this.offerRepository.findOne({
      where: { id: review.offerId },
    });
    if (offer) await this.clearOfferCaches(offer.id, offer.branchId);
  }
}
