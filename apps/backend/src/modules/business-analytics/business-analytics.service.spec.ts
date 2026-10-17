import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessAnalyticsService } from './business-analytics.service';

describe('BusinessAnalyticsService', () => {
  const query = jest.fn();
  const loyalty = {
    getBusinessPointsForCustomers: jest.fn().mockResolvedValue(new Map()),
    tierForPoints: jest.fn().mockReturnValue('Bronze'),
  };
  const service = new BusinessAnalyticsService(
    { query } as any,
    loyalty as any,
  );
  const now = new Date('2026-10-16T12:00:00.000Z');

  beforeEach(() => query.mockReset());

  describe('resolveRange', () => {
    it('defaults to the last 30 days and a previous period of the same length', async () => {
      const range = await service.resolveRange('biz', {}, now);
      expect(range).toEqual({
        from: '2026-09-16T12:00:00.000Z',
        to: '2026-10-16T12:00:00.000Z',
        previousFrom: '2026-08-17T12:00:00.000Z',
        previousTo: '2026-09-16T12:00:00.000Z',
        days: 30,
        branchId: null,
      });
      expect(query).not.toHaveBeenCalled();
    });

    it('rejects an inverted or empty range', async () => {
      await expect(
        service.resolveRange(
          'biz',
          { from: '2026-10-10', to: '2026-10-01' },
          now,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.resolveRange(
          'biz',
          { from: '2026-10-10', to: '2026-10-10' },
          now,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a range longer than a year', async () => {
      await expect(
        service.resolveRange(
          'biz',
          { from: '2024-01-01', to: '2026-01-01' },
          now,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires the business id', async () => {
      await expect(service.resolveRange('', {}, now)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('404s a branch of another business', async () => {
      query.mockResolvedValueOnce([]);
      await expect(
        service.resolveRange('biz', { branchId: 'other-branch' }, now),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('"branches"'),
        ['other-branch', 'biz'],
      );
    });

    it('keeps an owned branch', async () => {
      query.mockResolvedValueOnce([{ '?column?': 1 }]);
      const range = await service.resolveRange('biz', { branchId: 'b1' }, now);
      expect(range.branchId).toBe('b1');
    });
  });

  describe('getPos', () => {
    it('passes the shared parameter layout and shapes totals, tenders and hourly', async () => {
      query.mockImplementation((sql: string) => {
        if (sql.includes('"pos_split_payments"')) {
          return Promise.resolve([
            { method: 'cash', count: 3, amount: '3000' },
            { method: 'card', count: 1, amount: '1000' },
          ]);
        }
        if (sql.includes('EXTRACT(HOUR')) {
          return Promise.resolve([{ hour: 14, sales: '4000', tickets: 4 }]);
        }
        if (sql.includes('AS "previousSales"')) {
          return Promise.resolve([
            {
              sales: '4000',
              previousSales: '2000',
              tickets: 4,
              previousTickets: 2,
            },
          ]);
        }
        if (sql.includes('AS items')) return Promise.resolve([{ items: 10 }]);
        if (sql.includes("IN ('refunded', 'partial_refund')")) {
          return Promise.resolve([{ count: 1, amount: '500' }]);
        }
        if (sql.includes('"variance"')) {
          return Promise.resolve([
            { variance: '-200', counted: 1, sessions: 2 },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.getPos('biz', {
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-11T00:00:00.000Z',
      });

      for (const [, params] of query.mock.calls) {
        expect(params).toEqual([
          'biz',
          '2026-09-21T00:00:00.000Z',
          '2026-10-01T00:00:00.000Z',
          '2026-10-11T00:00:00.000Z',
          null,
        ]);
      }
      expect(result.sales).toEqual({ current: 4000, previous: 2000 });
      expect(result.averageTicket).toEqual({ current: 1000, previous: 1000 });
      expect(result.itemsPerTicket).toBe(2.5);
      expect(result.refunds).toEqual({ count: 1, amount: 500, rate: 0.2 });
      expect(result.drawer.variance).toBe(-200);
      expect(result.tenders.map((t) => t.share)).toEqual([0.75, 0.25]);
      expect(result.hourly).toHaveLength(24);
      expect(result.hourly[14]).toEqual({ hour: 14, sales: 4000, tickets: 4 });
    });
  });

  describe('getLocations', () => {
    it('ranks branches with revenue share and percent of the best', async () => {
      query.mockImplementation((sql: string) => {
        if (sql.includes('FROM "branches" b')) {
          return Promise.resolve([
            {
              branchId: 'a',
              name: 'A',
              revenue: '3000',
              previousRevenue: '1000',
              orders: 3,
              rating: '4.66',
            },
            {
              branchId: 'b',
              name: 'B',
              revenue: '1000',
              previousRevenue: '0',
              orders: 0,
              rating: null,
            },
          ]);
        }
        return Promise.resolve([]);
      });
      const result = await service.getLocations('biz', {});
      expect(result.totals.revenue).toEqual({ current: 4000, previous: 1000 });
      expect(
        result.branches.map((b) => [b.revenueShare, b.percentOfBest]),
      ).toEqual([
        [0.75, 100],
        [0.25, 33],
      ]);
      expect(result.branches[0].rating).toBe(4.7);
      expect(result.branches[1].averageOrderValue).toBe(0);
    });
  });
});
