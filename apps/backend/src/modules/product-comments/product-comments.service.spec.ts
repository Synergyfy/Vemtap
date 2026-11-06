import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductComment } from './entities/product-comment.entity';
import {
  PRODUCT_COMMENTS_URL,
  ProductCommentsService,
} from './product-comments.service';

const ITEM = { id: 'item-1', businessId: 'biz-1', isSuspended: false };

function aggregateBuilder(raw: unknown, rows: unknown[] = []) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(raw),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  return qb;
}

async function build() {
  const comments = {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((value: Partial<ProductComment>) => value),
    save: jest.fn((value: Partial<ProductComment>) =>
      Promise.resolve({
        id: 'comment-1',
        createdAt: new Date('2026-10-17T10:00:00Z'),
        updatedAt: new Date('2026-10-17T10:00:00Z'),
        ...value,
      }),
    ),
    softDelete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() =>
      aggregateBuilder({ average: '4.5', rated: '2' }),
    ),
  };
  const items = { findOne: jest.fn().mockResolvedValue(ITEM) };
  const users = {
    find: jest.fn().mockResolvedValue([{ id: 'owner-1' }, { id: 'manager-1' }]),
  };
  const notifications = { createMany: jest.fn().mockResolvedValue([]) };
  const module = await Test.createTestingModule({
    providers: [
      ProductCommentsService,
      { provide: getRepositoryToken(ProductComment), useValue: comments },
      { provide: getRepositoryToken(CatalogueItem), useValue: items },
      { provide: getRepositoryToken(User), useValue: users },
      { provide: NotificationsService, useValue: notifications },
    ],
  }).compile();
  return {
    service: module.get(ProductCommentsService),
    comments,
    items,
    users,
    notifications,
  };
}

describe('ProductCommentsService', () => {
  describe('create', () => {
    it('publishes a comment under a first name and last initial', async () => {
      const { service, comments } = await build();

      const result = await service.create(
        { id: 'user-1', firstName: 'Ada', lastName: 'Okafor' },
        'item-1',
        { comment: 'Lovely', rating: 5 },
      );

      expect(comments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item-1',
          businessId: 'biz-1',
          userId: 'user-1',
          authorName: 'Ada O.',
          rating: 5,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ id: 'comment-1', isMine: true }),
      );
    });

    it('tells the owner and managers, batched as a product comment', async () => {
      const { service, notifications } = await build();

      await service.create(
        { id: 'user-1', firstName: 'Ada', lastName: 'Okafor' },
        'item-1',
        { comment: 'Too salty', rating: 2 },
      );
      await new Promise((resolve) => setImmediate(resolve));

      expect(notifications.createMany).toHaveBeenCalledWith(
        ['owner-1', 'manager-1'],
        'New Product Comment',
        expect.stringContaining('Ada O.'),
        'error',
        PRODUCT_COMMENTS_URL,
        expect.objectContaining({ cta: 'Reply' }),
        'product_comment',
      );
    });

    it('still saves the comment when the notification fails', async () => {
      const { service, notifications } = await build();
      notifications.createMany.mockRejectedValue(new Error('down'));

      await expect(
        service.create({ id: 'user-1' }, 'item-1', { comment: 'Nice' }),
      ).resolves.toEqual(expect.objectContaining({ id: 'comment-1' }));
    });

    it('refuses a second comment from the same customer', async () => {
      const { service, comments } = await build();
      comments.findOne.mockResolvedValue({ id: 'earlier' });

      await expect(
        service.create({ id: 'user-1' }, 'item-1', { comment: 'Again' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('stops a business commenting on its own product', async () => {
      const { service } = await build();

      await expect(
        service.create({ id: 'owner-1', businessId: 'biz-1' }, 'item-1', {
          comment: 'Best in town',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('hides suspended or missing products', async () => {
      const { service, items } = await build();
      items.findOne.mockResolvedValueOnce({ ...ITEM, isSuspended: true });
      await expect(
        service.create({ id: 'user-1' }, 'item-1', { comment: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      items.findOne.mockResolvedValueOnce(null);
      await expect(service.list('item-1', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('returns the page with the rating summary and the viewer flag', async () => {
      const { service, comments } = await build();
      comments.findAndCount.mockResolvedValue([
        [
          { id: 'a', userId: 'user-1', authorName: 'Ada O.', comment: 'Hi' },
          { id: 'b', userId: 'user-2', authorName: 'Bayo K.', comment: 'Yo' },
        ],
        2,
      ]);

      const result = await service.list('item-1', { limit: 5 }, 'user-1');

      expect(result.total).toBe(2);
      expect(result.averageRating).toBe(4.5);
      expect(result.ratingCount).toBe(2);
      expect(result.comments.map((c) => c.isMine)).toEqual([true, false]);
      expect(comments.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 5 }),
      );
    });
  });

  describe('own comment', () => {
    it("forbids editing someone else's comment", async () => {
      const { service, comments } = await build();
      comments.findOne.mockResolvedValue({ id: 'c', userId: 'user-2' });

      await expect(
        service.update('user-1', 'item-1', 'c', { comment: 'edit' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('soft-deletes the author’s comment', async () => {
      const { service, comments } = await build();
      comments.findOne.mockResolvedValue({ id: 'c', userId: 'user-1' });

      await service.remove('user-1', 'item-1', 'c');

      expect(comments.softDelete).toHaveBeenCalledWith('c');
    });
  });

  describe('business', () => {
    it('only replies to comments on its own products', async () => {
      const { service, comments } = await build();

      await expect(
        service.reply('biz-2', 'c', 'staff-1', 'Thanks'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(comments.findOne).toHaveBeenCalledWith({
        where: { id: 'c', businessId: 'biz-2' },
      });
    });

    it('stamps the reply and who wrote it', async () => {
      const { service, comments } = await build();
      comments.findOne.mockResolvedValue({ id: 'c', businessId: 'biz-1' });

      const result = await service.reply('biz-1', 'c', 'staff-1', 'Thanks!');

      expect(result.merchantReply).toBe('Thanks!');
      expect(comments.save).toHaveBeenCalledWith(
        expect.objectContaining({ repliedById: 'staff-1' }),
      );
    });

    it('summarises totals, unreplied and a fixed 1–5 spread', async () => {
      const { service, comments } = await build();
      comments.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
      comments.createQueryBuilder
        .mockImplementationOnce(() =>
          aggregateBuilder({ average: '4.33', rated: '3' }),
        )
        .mockImplementationOnce(() =>
          aggregateBuilder(null, [
            { rating: 5, count: '2' },
            { rating: '3', count: '1' },
          ]),
        );

      const summary = await service.summaryForBusiness('biz-1');

      expect(summary).toEqual({
        total: 4,
        unreplied: 1,
        ratingCount: 3,
        averageRating: 4.3,
        ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
      });
    });
  });
});
