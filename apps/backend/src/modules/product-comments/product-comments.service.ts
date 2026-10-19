import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductComment } from './entities/product-comment.entity';
import {
  BusinessProductCommentsQueryDto,
  CreateProductCommentDto,
  ProductCommentsQueryDto,
  UpdateProductCommentDto,
} from './dto/product-comment.dto';

export interface CommentAuthor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  businessId?: string | null;
}

/** Items customers cannot see, so cannot comment on or read comments for. */
const HIDDEN_STATUSES = [
  CatalogueItemStatus.ARCHIVED,
  CatalogueItemStatus.SUSPENDED,
];

/** Where a comment notification opens in the business app. */
export const PRODUCT_COMMENTS_URL = '/business/reviews?source=products';

@Injectable()
export class ProductCommentsService {
  private readonly logger = new Logger(ProductCommentsService.name);

  constructor(
    @InjectRepository(ProductComment)
    private readonly commentRepository: Repository<ProductComment>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // --- Customer side ---

  /** Newest first, with the item's rating summary and the caller's own flag. */
  async list(
    itemId: string,
    query: ProductCommentsQueryDto,
    viewerId?: string,
  ) {
    await this.getVisibleItemOrThrow(itemId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [[rows, total], summary] = await Promise.all([
      this.commentRepository.findAndCount({
        where: { itemId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.ratingSummary({ itemId }),
    ]);

    return {
      comments: rows.map((row) => this.present(row, viewerId)),
      total,
      page,
      limit,
      ...summary,
    };
  }

  async create(
    author: CommentAuthor,
    itemId: string,
    dto: CreateProductCommentDto,
  ) {
    const item = await this.getVisibleItemOrThrow(itemId);
    if (author.businessId && author.businessId === item.businessId) {
      throw new ForbiddenException('You cannot comment on your own product');
    }
    const existing = await this.commentRepository.findOne({
      where: { itemId, userId: author.id },
    });
    if (existing) {
      throw new ConflictException('You have already commented on this product');
    }

    const saved = await this.commentRepository.save(
      this.commentRepository.create({
        itemId,
        businessId: item.businessId,
        userId: author.id,
        authorName: authorName(author),
        comment: dto.comment,
        rating: dto.rating ?? null,
      }),
    );
    // Fire and forget: a failed notification must not fail the comment.
    void this.notifyBusiness(item, saved).catch((error: unknown) =>
      this.logger.error(
        `Failed to notify business of product comment: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
    return this.present(saved, author.id);
  }

  async update(
    userId: string,
    itemId: string,
    commentId: string,
    dto: UpdateProductCommentDto,
  ) {
    const comment = await this.getOwnOrThrow(userId, itemId, commentId);
    if (dto.comment !== undefined) comment.comment = dto.comment;
    if (dto.rating !== undefined) comment.rating = dto.rating;
    return this.present(await this.commentRepository.save(comment), userId);
  }

  async remove(userId: string, itemId: string, commentId: string) {
    const comment = await this.getOwnOrThrow(userId, itemId, commentId);
    await this.commentRepository.softDelete(comment.id);
  }

  // --- Business side ---

  async listForBusiness(
    businessId: string,
    query: BusinessProductCommentsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.item', 'item')
      .where('comment.businessId = :businessId', { businessId })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.itemId) {
      qb.andWhere('comment.itemId = :itemId', { itemId: query.itemId });
    }
    if (query.replied === 'unreplied') {
      qb.andWhere('comment.merchantReply IS NULL');
    } else if (query.replied === 'replied') {
      qb.andWhere('comment.merchantReply IS NOT NULL');
    }
    const [rows, total] = await qb.getManyAndCount();

    return {
      comments: rows.map((row) => ({
        ...this.present(row),
        itemId: row.itemId,
        itemName: row.item?.name ?? null,
        itemImage: row.item?.mainImage ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  /** Totals for the reviews screen header: everything published is counted. */
  async summaryForBusiness(businessId: string) {
    const [total, summary, unreplied, distributionRows] = await Promise.all([
      this.commentRepository.count({ where: { businessId } }),
      this.ratingSummary({ businessId }),
      this.commentRepository.count({
        where: { businessId, merchantReply: IsNull() },
      }),
      this.commentRepository
        .createQueryBuilder('comment')
        .select('comment.rating', 'rating')
        .addSelect('COUNT(comment.id)', 'count')
        .where('comment.businessId = :businessId', { businessId })
        .andWhere('comment.rating IS NOT NULL')
        .groupBy('comment.rating')
        .getRawMany<{ rating: string | number; count: string }>(),
    ]);

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const row of distributionRows) {
      const stars = Number(row.rating);
      if (stars >= 1 && stars <= 5) {
        ratingDistribution[stars] = Number(row.count) || 0;
      }
    }
    return { total, unreplied, ...summary, ratingDistribution };
  }

  async reply(
    businessId: string,
    commentId: string,
    staffId: string | null,
    reply: string,
  ) {
    const comment = await this.getBusinessCommentOrThrow(businessId, commentId);
    comment.merchantReply = reply;
    comment.repliedAt = new Date();
    comment.repliedById = staffId;
    await this.commentRepository.save(comment);
    return {
      id: comment.id,
      merchantReply: comment.merchantReply,
      repliedAt: comment.repliedAt,
    };
  }

  async removeReply(businessId: string, commentId: string) {
    const comment = await this.getBusinessCommentOrThrow(businessId, commentId);
    comment.merchantReply = null;
    comment.repliedAt = null;
    comment.repliedById = null;
    await this.commentRepository.save(comment);
  }

  async removeByBusiness(businessId: string, commentId: string) {
    const comment = await this.getBusinessCommentOrThrow(businessId, commentId);
    await this.commentRepository.softDelete(comment.id);
  }

  // --- Helpers ---

  /**
   * Tells the people who can answer — the owner and managers — in the same
   * bell as orders and ratings. A rush of comments batches into one row.
   */
  private async notifyBusiness(item: CatalogueItem, comment: ProductComment) {
    const recipients = await this.userRepository.find({
      where: {
        businessId: item.businessId,
        role: In([UserRole.OWNER, UserRole.MANAGER]),
      },
      select: ['id'],
    });
    if (recipients.length === 0) return;
    const product = item.name || 'your product';
    const stars = comment.rating ? ` (${comment.rating}★)` : '';
    await this.notificationsService.createMany(
      recipients.map((user) => user.id),
      'New Product Comment',
      `${comment.authorName} commented on ${product}${stars}: "${truncate(comment.comment, 120)}"`,
      comment.rating && comment.rating <= 2 ? 'error' : 'info',
      PRODUCT_COMMENTS_URL,
      {
        footnote: comment.authorName,
        cta: 'Reply',
        ...(comment.rating
          ? { stat: { label: 'Rating', value: `${comment.rating}/5` } }
          : {}),
      },
      'product_comment',
    );
  }

  private async getVisibleItemOrThrow(itemId: string): Promise<CatalogueItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, status: Not(In(HIDDEN_STATUSES)) },
      select: ['id', 'businessId', 'isSuspended', 'name'],
    });
    if (!item || item.isSuspended) {
      throw new NotFoundException('Product not found');
    }
    return item;
  }

  private async getOwnOrThrow(
    userId: string,
    itemId: string,
    commentId: string,
  ): Promise<ProductComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, itemId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only change your own comment');
    }
    return comment;
  }

  private async getBusinessCommentOrThrow(
    businessId: string,
    commentId: string,
  ): Promise<ProductComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, businessId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  /** Average and count over rated comments, as one aggregate. */
  private async ratingSummary(where: { itemId?: string; businessId?: string }) {
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .select('AVG(comment.rating)', 'average')
      .addSelect('COUNT(comment.rating)', 'rated');
    if (where.itemId) {
      qb.where('comment.itemId = :itemId', { itemId: where.itemId });
    } else {
      qb.where('comment.businessId = :businessId', {
        businessId: where.businessId,
      });
    }
    const row = await qb.getRawOne<{
      average: string | null;
      rated: string;
    }>();
    const ratingCount = Number(row?.rated ?? 0) || 0;
    const average = row?.average != null ? Number(row.average) : null;
    return {
      ratingCount,
      averageRating:
        ratingCount > 0 && average !== null && Number.isFinite(average)
          ? Math.round(average * 10) / 10
          : null,
    };
  }

  private present(row: ProductComment, viewerId?: string) {
    return {
      id: row.id,
      authorName: row.authorName,
      comment: row.comment,
      rating: row.rating,
      merchantReply: row.merchantReply,
      repliedAt: row.repliedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isMine: Boolean(viewerId && row.userId === viewerId),
    };
  }
}

/** "Ada O." from the account name; never the email or phone. */
function authorName(author: CommentAuthor): string {
  const first = author.firstName?.trim() ?? '';
  const lastInitial = author.lastName?.trim().charAt(0) ?? '';
  const name = [first, lastInitial ? `${lastInitial}.` : '']
    .filter(Boolean)
    .join(' ');
  return name || 'VemTap customer';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
}
