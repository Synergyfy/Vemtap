import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessCustomersService } from './business-customers.service';

describe('BusinessCustomersService', () => {
  const query = jest.fn();
  const notes = {
    findOne: jest.fn(),
    create: jest.fn((row: object) => ({ ...row })),
    save: jest.fn((row: object) =>
      Promise.resolve({ ...row, updatedAt: new Date('2026-10-16') }),
    ),
  };
  const loyalty = {
    getBusinessPointsForCustomers: jest
      .fn()
      .mockResolvedValue(new Map([['u1', 2500]])),
    tierForPoints: jest.fn((points: number) =>
      points >= 2000 ? 'Gold' : 'Bronze',
    ),
  };
  const service = new BusinessCustomersService(
    { query } as any,
    notes as any,
    loyalty as any,
  );

  const row = {
    uid: 'u1',
    firstName: 'Ada',
    lastName: 'Obi',
    email: 'ada@example.com',
    phone: '+234',
    avatar: null,
    visits: 12,
    orders: 9,
    claims: 2,
    bookings: 1,
    spend: '150000',
    firstAt: '2026-01-01T00:00:00.000Z',
    lastAt: '2026-10-15T00:00:00.000Z',
    lastKind: 'pos',
    lastRef: 'RC-1',
    frequent: true,
    isNew: false,
    inactive: false,
  };

  beforeEach(() => {
    query.mockReset();
    notes.findOne.mockReset();
    notes.save.mockClear();
  });

  it('pages the directory and reports counts for the chosen segment', async () => {
    query.mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('AS "totalSpend"')
          ? [
              {
                all: 30,
                frequent: 4,
                returning: 10,
                new: 6,
                inactive: 8,
                customers: 30,
                totalSpend: '1000000',
                frequentSpend: '580000',
                frequentCustomers: 4,
                dormant: 5,
              },
            ]
          : [row],
      ),
    );

    const result = await service.getDirectory('biz', {
      segment: 'frequent',
      search: ' ada ',
      page: 1,
      limit: 1,
    });

    expect(result.total).toBe(4);
    expect(result.hasNextPage).toBe(true);
    expect(result.meta.insight.frequentSpendShare).toBe(0.58);
    expect(result.meta.insight.averageSpend).toBe(33333.33);
    expect(result.data[0]).toMatchObject({
      userId: 'u1',
      name: 'Ada Obi',
      segment: 'frequent',
      pointsBalance: 2500,
      tier: 'Gold',
      spend: 150000,
      lastInteraction: { kind: 'pos', reference: 'RC-1' },
    });
    // Search is parameterised and trimmed; the page query filters by segment.
    const calls = query.mock.calls as [string, unknown[]][];
    const pageCall = calls.find(([sql]) => sql.includes('LIMIT 1 OFFSET 0'));
    expect(pageCall?.[0]).toContain('seg.frequent');
    expect(pageCall?.[1]).toEqual(['biz', null, '%ada%']);
  });

  it('404s a branch of another business', async () => {
    query.mockResolvedValueOnce([]);
    await expect(
      service.getDirectory('biz', { branchId: 'other' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s a dossier for someone who never touched the business', async () => {
    query.mockResolvedValue([]);
    await expect(service.getDossier('biz', 'stranger')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses an empty note update and notes on strangers', async () => {
    await expect(
      service.saveNote('biz', 'u1', 'staff', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    query.mockResolvedValueOnce([]);
    await expect(
      service.saveNote('biz', 'stranger', 'staff', { note: 'hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates the note once and updates only what was sent', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);
    notes.findOne.mockResolvedValueOnce(null);
    const created = await service.saveNote('biz', 'u1', 'staff', {
      note: '  Patio seat  ',
      tags: ['vip'],
    });
    expect(created).toMatchObject({ note: 'Patio seat', tags: ['vip'] });

    notes.findOne.mockResolvedValueOnce({ note: 'Patio seat', tags: ['vip'] });
    const updated = await service.saveNote('biz', 'u1', 'staff2', { tags: [] });
    expect(updated).toMatchObject({ note: 'Patio seat', tags: [] });
    expect(notes.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ updatedById: 'staff2' }),
    );
  });
});
