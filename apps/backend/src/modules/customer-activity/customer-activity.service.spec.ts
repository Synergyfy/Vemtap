import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { CustomerActivityService } from './customer-activity.service';

async function build(rows: unknown[] = [], total = 0) {
  const query = jest.fn<Promise<unknown[]>, [string, unknown[]]>((sql) =>
    Promise.resolve(
      sql.includes('COUNT(*)::int AS total') ? [{ total }] : rows,
    ),
  );
  const module = await Test.createTestingModule({
    providers: [
      CustomerActivityService,
      { provide: getDataSourceToken(), useValue: { query } },
    ],
  }).compile();
  return { service: module.get(CustomerActivityService), query };
}

const customer = {
  id: 'user-1',
  email: 'Ada@Example.com',
  phone: '+2348000000000',
};

describe('CustomerActivityService', () => {
  it('scopes every query to the caller and pages newest first', async () => {
    const { service, query } = await build(
      [{ kind: 'order', id: 'o1', amount: '4500.00', rating: null }],
      1,
    );

    const result = await service.list(customer, { page: 2, limit: 5 });

    const [sql, params] = query.mock.calls[0];
    expect(params.slice(0, 4)).toEqual([
      'user-1',
      'ada@example.com',
      '+2348000000000',
      null,
    ]);
    expect(sql).toContain('ORDER BY a."at" DESC');
    expect(sql).toContain('LIMIT 5 OFFSET 5');
    expect(result).toEqual({
      data: [{ kind: 'order', id: 'o1', amount: 4500, rating: null }],
      total: 1,
      page: 2,
      limit: 5,
    });
  });

  it('narrows by kind: visits include orders, reviews include product comments', async () => {
    const { service, query } = await build();

    await service.list(customer, { kind: 'visits' });
    expect(query.mock.calls[0][1][4]).toEqual(['visit', 'order']);

    query.mockClear();
    await service.list(customer, { kind: 'reviews' });
    expect(query.mock.calls[0][1][4]).toEqual(['review', 'comment']);
  });

  it('passes the period start and counts the same rows for the summary', async () => {
    const { service, query } = await build([
      {
        claimed: '3',
        redeemed: '1',
        orders: '2',
        bookings: '0',
        visits: '4',
        reviews: '1',
        businesses: '2',
      },
    ]);

    const summary = await service.summary(
      { id: 'user-1', email: null, phone: null },
      '2026-10-01',
    );

    expect(query.mock.calls[0][1]).toEqual(['user-1', '', '', '2026-10-01']);
    expect(summary).toEqual({
      claimed: 3,
      redeemed: 1,
      orders: 2,
      bookings: 0,
      visits: 4,
      reviews: 1,
      businesses: 2,
    });
  });

  it('previews the customer side for the caller only, with active claims', async () => {
    const { service, query } = await build([
      {
        activeClaims: 2,
        savedPlaces: 5,
        savedDeals: 1,
        latestClaim: { offerId: 'o1', title: 'Lunch', businessName: 'Aurora' },
      },
    ]);

    const preview = await service.switchPreview(customer);

    const [sql, params] = query.mock.calls[0];
    expect(params).toEqual([
      'user-1',
      'ada@example.com',
      '+2348000000000',
      null,
    ]);
    expect(sql).toContain("a.status = 'active'");
    expect(sql).toContain('saved_businesses');
    expect(preview).toEqual({
      activeClaims: 2,
      savedPlaces: 5,
      savedDeals: 1,
      latestClaim: { offerId: 'o1', title: 'Lunch', businessName: 'Aurora' },
    });
  });
});
