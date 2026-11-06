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
      menu: { itemIds: [malicious], orderedAtLeast: 2 },
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

describe('SegmentCriteriaService new criteria', () => {
  const service = new SegmentCriteriaService({ query: jest.fn() } as any);
  const placeholdersMatch = (sql: string, params: unknown[]) => {
    const used = new Set(
      [...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])),
    );
    expect(Math.max(...used)).toBe(params.length);
  };

  it('leaves saves and chats out of a segment that does not ask about them', () => {
    const { sql } = service.buildMemberQuery('biz-1', {
      recency: { visitedWithinDays: 30 },
    });
    expect(sql).not.toContain('"deal_saves"');
    expect(sql).not.toContain('"conversation_threads"');
  });

  it('matches customers whose home district is one of those chosen', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      location: { homeDistrictIds: ['d-wuse'] },
    });
    expect(sql).toMatch(/u\."homeDistrictId" = ANY\(\$2::uuid\[\]\)/);
    expect(params).toEqual(['biz-1', ['d-wuse']]);
  });

  it('matches savers who never redeemed, without also requiring a claim', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      deals: { savedNotRedeemed: true },
    });
    // Savers count as customers for this segment only.
    expect(sql).toMatch(/UNION ALL\s+SELECT s\."userId"/);
    expect(sql).toMatch(
      /NOT EXISTS \(\s+SELECT 1 FROM "catalogue_offer_claims" rc/,
    );
    expect(sql).not.toMatch(/SELECT COUNT\(\*\) FROM "catalogue_offer_claims"/);
    expect(params).toEqual(['biz-1']);
  });

  it('keeps "claimed the chosen deal" alongside saved-not-redeemed', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      deals: { savedNotRedeemed: true, offerIds: ['o-1'] },
    });
    // The saved rule covers any deal; the chosen deal is still a claim rule.
    expect(sql).toMatch(/SELECT COUNT\(\*\) FROM "catalogue_offer_claims"/);
    expect(sql).toMatch(/c\."offerId" = ANY\(\$2::uuid\[\]\)/);
    expect(params).toEqual(['biz-1', ['o-1'], 1]);
    placeholdersMatch(sql, params);
  });

  it('matches a QR visit or chat within the window, adding chats as touches', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      recency: { interactedWithinDays: 14 },
    });
    expect(sql).toContain(`'chat'`);
    expect(sql).toMatch(
      /FROM "visits" v[\s\S]+OR EXISTS \([\s\S]+"conversation_threads" ct/,
    );
    expect(params).toEqual(['biz-1', 14]);
  });

  it('matches unspent points as earned minus redeemed', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      loyalty: { minPoints: 500 },
    });
    expect(sql).toMatch(
      /CASE WHEN pt\."type" = 'earned' THEN pt\."amount" ELSE -pt\."amount" END/,
    );
    expect(params).toEqual(['biz-1', 500]);
  });

  it('keeps last activity to visits, orders, sales and claims', () => {
    const { sql } = service.buildMemberQuery('biz-1', {
      deals: { savedNotRedeemed: true },
      recency: { notVisitedForDays: 60 },
    });
    expect(sql).toContain(
      `MAX(at) FILTER (WHERE kind NOT IN ('save', 'chat'))`,
    );
  });

  it('parameterises all four criteria together', () => {
    const { sql, params } = service.buildMemberQuery('biz-1', {
      location: { homeDistrictIds: ['d-1'] },
      deals: { savedNotRedeemed: true, offerIds: ['o-1'] },
      recency: { interactedWithinDays: 14 },
      loyalty: { minPoints: 500 },
    });
    expect(params).toEqual(['biz-1', 14, ['d-1'], 500, ['o-1'], 1]);
    placeholdersMatch(sql, params);
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
