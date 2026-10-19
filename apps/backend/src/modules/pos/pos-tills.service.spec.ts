import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PosTillsService } from './pos-tills.service';
import { PosTillStatus } from './entities/pos-enums';

describe('PosTillsService', () => {
  const tillRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn((dto: unknown) => dto),
    save: jest.fn((till: object) => Promise.resolve({ id: 'till-1', ...till })),
    softDelete: jest.fn(),
  };
  const sessionRepo = { find: jest.fn(), count: jest.fn() };
  const saleRepo = {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ tillId: 'till-1', sum: '12500', count: '3' }]),
    })),
  };
  const branchRepo = { findOne: jest.fn(), find: jest.fn() };
  const subscriptionRepo = { findOne: jest.fn() };
  const service = new PosTillsService(
    tillRepo as never,
    sessionRepo as never,
    saleRepo as never,
    branchRepo as never,
    subscriptionRepo as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists tills with the open session occupant and today takings', async () => {
    tillRepo.find.mockResolvedValueOnce([
      {
        id: 'till-1',
        branchId: 'br-1',
        name: 'Front',
        code: 'TILL-01',
        status: PosTillStatus.IDLE,
      },
      {
        id: 'till-2',
        branchId: 'br-1',
        name: 'Bar',
        code: 'TILL-02',
        status: PosTillStatus.IDLE,
      },
    ]);
    sessionRepo.find.mockResolvedValueOnce([
      {
        id: 's-1',
        tillId: 'till-1',
        cashierId: 'u-1',
        openedAt: new Date('2026-10-16T08:00:00Z'),
        cashier: { firstName: 'Ada', lastName: 'Obi' },
      },
    ]);
    subscriptionRepo.findOne.mockResolvedValueOnce({
      plan: { posTerminalLimit: 3 },
    });

    const result = await service.list('bus-1');

    expect(result.limit).toBe(3);
    expect(result.data[0]).toMatchObject({
      status: PosTillStatus.ACTIVE,
      occupant: { cashierName: 'Ada Obi' },
      todaySales: 12500,
      todayTransactions: 3,
    });
    expect(result.data[1]).toMatchObject({
      status: PosTillStatus.IDLE,
      occupant: null,
      todaySales: 0,
    });
  });

  it('refuses a till beyond the plan terminal limit', async () => {
    branchRepo.findOne.mockResolvedValueOnce({ id: 'br-1' });
    tillRepo.count.mockResolvedValueOnce(2);
    subscriptionRepo.findOne.mockResolvedValueOnce({
      plan: { posTerminalLimit: 2 },
    });

    await expect(
      service.create('bus-1', { branchId: 'br-1', name: 'Third' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('treats -1 or an unset limit as unlimited and generates a code', async () => {
    branchRepo.findOne.mockResolvedValueOnce({ id: 'br-1' });
    tillRepo.count.mockResolvedValueOnce(4);
    subscriptionRepo.findOne.mockResolvedValueOnce({
      plan: { posTerminalLimit: -1 },
    });
    tillRepo.findOne.mockResolvedValueOnce(null);

    const till = await service.create('bus-1', {
      branchId: 'br-1',
      name: ' Patio ',
    });

    expect(till).toMatchObject({ code: 'TILL-05', name: 'Patio' });
  });

  it('rejects a branch from another business', async () => {
    branchRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.create('bus-1', { branchId: 'other', name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('will not open a second session on a busy till', async () => {
    tillRepo.findOne.mockResolvedValueOnce({
      id: 'till-1',
      status: PosTillStatus.IDLE,
    });
    sessionRepo.count.mockResolvedValueOnce(1);
    await expect(service.claimForSession('bus-1', 'till-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('will not delete a till with an open session', async () => {
    tillRepo.findOne.mockResolvedValueOnce({ id: 'till-1' });
    sessionRepo.count.mockResolvedValueOnce(1);
    await expect(service.remove('bus-1', 'till-1')).rejects.toThrow(
      ConflictException,
    );
    expect(tillRepo.softDelete).not.toHaveBeenCalled();
  });
});
