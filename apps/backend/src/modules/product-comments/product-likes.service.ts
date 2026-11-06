import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import { ProductLike } from './entities/product-like.entity';

export interface ProductLikeState {
  liked: boolean;
  likesCount: number;
}

const HIDDEN_STATUSES = [
  CatalogueItemStatus.ARCHIVED,
  CatalogueItemStatus.SUSPENDED,
];

/**
 * Likes on catalogue products and services. Like and unlike are idempotent
 * (liking twice keeps one like), so a repeated tap or a retried request can
 * never flip the state the customer asked for. Every call answers with the
 * resulting state and the live count.
 */
@Injectable()
export class ProductLikesService {
  constructor(
    @InjectRepository(ProductLike)
    private readonly likeRepository: Repository<ProductLike>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
  ) {}

  async status(itemId: string, viewerId?: string): Promise<ProductLikeState> {
    await this.getVisibleItemOrThrow(itemId);
    return this.state(itemId, viewerId);
  }

  async like(userId: string, itemId: string): Promise<ProductLikeState> {
    await this.getVisibleItemOrThrow(itemId);
    await this.likeRepository
      .createQueryBuilder()
      .insert()
      .into(ProductLike)
      .values({ itemId, userId })
      .orIgnore()
      .execute();
    return this.state(itemId, userId);
  }

  async unlike(userId: string, itemId: string): Promise<ProductLikeState> {
    await this.getVisibleItemOrThrow(itemId);
    await this.likeRepository.delete({ itemId, userId });
    return this.state(itemId, userId);
  }

  private async state(
    itemId: string,
    viewerId?: string,
  ): Promise<ProductLikeState> {
    const [likesCount, mine] = await Promise.all([
      this.likeRepository.count({ where: { itemId } }),
      viewerId
        ? this.likeRepository.exists({ where: { itemId, userId: viewerId } })
        : Promise.resolve(false),
    ]);
    return { liked: mine, likesCount };
  }

  private async getVisibleItemOrThrow(itemId: string): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, status: Not(In(HIDDEN_STATUSES)) },
      select: ['id', 'isSuspended'],
    });
    if (!item || item.isSuspended) {
      throw new NotFoundException('Product not found');
    }
  }
}
