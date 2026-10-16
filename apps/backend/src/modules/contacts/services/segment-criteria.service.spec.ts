import { SegmentCriteriaService } from './segment-criteria.service';

describe('SegmentCriteriaService.buildMemberQuery', () => {
  const service = new SegmentCriteriaService({ query: jest.fn() } as any);

  it('matches every customer with no criteria, scoped to the business', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {});
    expect(params).toEqual(['biz-1']);
    expect(sql).not.toMatch(/WHERE per\./);
    expect(sql).toMatch(/"businessId" = \$1/);
  });

  it('parameterises every criteria value', () => {
    const malicious = "1'; DROP TABLE users; --";
    const { sql, params } = service.buildMemberQuery('biz-1', {
      recency: { visitedWithinDays: 30, notVisitedForDays: 7, minVisits: 3 },
      spend: { minTotal: 50000, minAverageTicket: 20000 },
      location: { branchIds: ['b-1'] },
      deals: { offerIds: ['o-1'], redeemedAtLeast: 2, withinDays: 60 },
      menu: { itemIds: [malicious as any], orderedAtLeast: 2 },
    });

    expect(sql).not.toContain('DROP TABLE');
    expect(params).toEqual([
      'biz-1',
      30,
      7,
      3,
      50000,
      20000,
      ['b-1'],
      ['o-1'],
      60,
      2,
      [malicious],
      2,
    ]);
    // Every placeholder used exists.
    const used = new Set(
      [...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])),
    );
    expect(Math.max(...used)).toBe(params.length);
  });

  it('matches any branch row of a multi-branch deal', () => {
    const { sql } = service.buildMemberQuery('biz-1', {
      deals: { offerIds: ['o-1'] },
    });
    expect(sql).toMatch(/"dealGroupId" IN/);
  });

  it('defaults deal and menu thresholds to one', () => {
    const { params } = service.buildMemberQuery('biz-1', {
      deals: {},
      menu: { itemIds: ['i-1'] },
    });
    expect(params).toEqual(['biz-1', 1, ['i-1'], 1]);
  });
});

describe('SegmentCriteriaService.reach', () => {
  it('counts nobody when the segment is empty', async () => {
    const query = jest.fn();
    const service = new SegmentCriteriaService({ query } as any);
    await expect(service.reach([])).resolves.toEqual({
      size: 0,
      reachableByPush: 0,
      reachableBySms: 0,
      reachableByEmail: 0,
      excludedFromPromotions: 0,
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('reaches only consenting members and reports the opted-out', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ push: 3, sms: 2, email: 1, excluded: 4 }]);
    const service = new SegmentCriteriaService({ query } as any);

    const reach = await service.reach([
      'u1',
      'u2',
      'u3',
      'u4',
      'u5',
      'u6',
      'u7',
    ]);

    expect(reach).toEqual({
      size: 7,
      reachableByPush: 3,
      reachableBySms: 2,
      reachableByEmail: 1,
      excludedFromPromotions: 4,
    });
    const [sql, params] = query.mock.calls[0];
    expect(params).toEqual([['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7']]);
    // Opted out of everything, or marketing turned off, means out.
    expect(sql).toMatch(/"optOut"/);
    expect(sql).toMatch(/->>'marketing', ''\) = 'false'/);
    // Each channel respects its own preference and the opt-in list.
    expect(sql).toMatch(/->>'push', ''\) <> 'false'/);
    expect(sql).toMatch(/'SMS' = ANY/);
    expect(sql).toMatch(/'EMAIL' = ANY/);
    expect((sql.match(/NOT "isOut"/g) ?? []).length).toBe(3);
  });
});
