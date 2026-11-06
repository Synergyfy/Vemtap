import { NotFoundException } from '@nestjs/common';
import { ProductLikesService } from './product-likes.service';

describe('ProductLikesService', () => {
  function setup(opts: { item?: unknown; count?: number; mine?: boolean }) {
    const execute = jest.fn().mockResolvedValue(undefined);
    const builder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };
    const likes = {
      createQueryBuilder: jest.fn(() => builder),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(opts.count ?? 0),
      exists: jest.fn().mockResolvedValue(opts.mine ?? false),
    };
    const items = {
      findOne: jest
        .fn()
        .mockResolvedValue(
          'item' in opts ? opts.item : { id: 'item-1', isSuspended: false },
        ),
    };
    const service = new ProductLikesService(likes as never, items as never);
    return { service, likes, builder };
  }

  it('likes idempotently and answers with the resulting state', async () => {
    const { service, builder } = setup({ count: 4, mine: true });
    await expect(service.like('user-1', 'item-1')).resolves.toEqual({
      liked: true,
      likesCount: 4,
    });
    expect(builder.values).toHaveBeenCalledWith({
      itemId: 'item-1',
      userId: 'user-1',
    });
    expect(builder.orIgnore).toHaveBeenCalled();
  });

  it('unlikes by removing only the caller’s like', async () => {
    const { service, likes } = setup({ count: 3, mine: false });
    await expect(service.unlike('user-1', 'item-1')).resolves.toEqual({
      liked: false,
      likesCount: 3,
    });
    expect(likes.delete).toHaveBeenCalledWith({
      itemId: 'item-1',
      userId: 'user-1',
    });
  });

  it('reports the count to anonymous viewers without a liked flag', async () => {
    const { service, likes } = setup({ count: 9 });
    await expect(service.status('item-1')).resolves.toEqual({
      liked: false,
      likesCount: 9,
    });
    expect(likes.exists).not.toHaveBeenCalled();
  });

  it('refuses hidden or missing items', async () => {
    const { service, likes } = setup({ item: null });
    await expect(service.like('user-1', 'item-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(likes.createQueryBuilder).not.toHaveBeenCalled();
  });
});
