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
