import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PosKitchenService } from './pos-kitchen.service';
import { CatalogueOrderStatus } from '../catalogue-orders/entities/catalogue-order.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('PosKitchenService', () => {
  const qb = (raw: unknown) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(raw),
    getRawOne: jest.fn().mockResolvedValue(raw),
  });
  const orderRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const saleRepo = { find: jest.fn() };
  const branchRepo = { findOne: jest.fn() };
  const orderService = { updateStatus: jest.fn() };
  const service = new PosKitchenService(
    orderRepo as never,
    saleRepo as never,
    branchRepo as never,
    orderService as never,
  );
  const staff = {
    id: 'u-1',
    businessId: 'bus-1',
    branchId: 'br-1',
    role: UserRole.STAFF,
  } as User;

  beforeEach(() => jest.clearAllMocks());

  it('streams orders with stage counts, prep average and unpaid total', async () => {
    branchRepo.findOne.mockResolvedValueOnce({ id: 'br-1' });
    orderRepo.find.mockResolvedValueOnce([
      {
        id: 'aaaaaaaa-1111',
        status: CatalogueOrderStatus.NEW,
        tableNumber: '12',
        totalAmount: 9700,
        createdAt: new Date(Date.now() - 5 * 60000),
        customer: { firstName: 'Tolu', phone: '+2348000000000' },
        items: [{ quantity: 2, priceAtOrder: 2700, item: { name: 'Jollof' } }],
      },
      {
        id: 'bbbbbbbb-2222',
        status: CatalogueOrderStatus.READY,
        totalAmount: 4500,
        createdAt: new Date(),
        items: [],
      },
    ]);
    orderRepo.createQueryBuilder
      .mockReturnValueOnce(
        qb([
          { status: 'new', count: '1' },
          { status: 'ready', count: '1' },
        ]),
      )
      .mockReturnValueOnce(qb({ minutes: '13.6' }));
    saleRepo.find.mockResolvedValueOnce([
      { id: 's-1', orderId: 'bbbbbbbb-2222' },
    ]);

    const result = await service.stream(staff, {});

    expect(result.counts).toEqual({
      new: 1,
      processing: 0,
      ready: 1,
      completed: 0,
    });
    expect(result.averagePrepMinutes).toBe(14);
    expect(result.unpaidTotal).toBe(9700);
    expect(result.data[0]).toMatchObject({
      reference: '#AAAAAAAA',
      guestName: 'Tolu',
      paid: false,
      elapsedMinutes: 5,
      lines: [{ name: 'Jollof', quantity: 2, lineTotal: 5400 }],
    });
    expect(result.data[1].paid).toBe(true);
  });

  it('rejects a branch outside the business', async () => {
    branchRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.stream(staff, { branchId: 'other' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('only allows forward moves', async () => {
    orderRepo.findOne.mockResolvedValueOnce({
      id: 'o-1',
      status: CatalogueOrderStatus.READY,
    });
    await expect(
      service.updateStatus(staff, 'o-1', {
        status: CatalogueOrderStatus.PROCESSING,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(orderService.updateStatus).not.toHaveBeenCalled();
  });

  it('delegates an allowed move to the order service', async () => {
    orderRepo.findOne.mockResolvedValueOnce({
      id: 'o-1',
      status: CatalogueOrderStatus.NEW,
    });
    await service.updateStatus(staff, 'o-1', {
      status: CatalogueOrderStatus.PROCESSING,
    });
    expect(orderService.updateStatus).toHaveBeenCalledWith(
      'o-1',
      { status: 'processing', reason: undefined },
      'bus-1',
      staff,
    );
  });
});
