import { PosLiveOrdersTipsSplit1818000000000 } from './migrations/1818000000000-PosLiveOrdersTipsSplit';

describe('PosLiveOrdersTipsSplit migration', () => {
  it('adds the timeline, tracking token, tip, rating and payer columns', async () => {
    const query = jest.fn<Promise<void>, [string]>();
    const migration = new PosLiveOrdersTipsSplit1818000000000();
    await migration.up({ query } as never);
    const up = query.mock.calls.map(([sql]) => sql).join('\n');
    expect(up).toMatch(/"statusTimeline" jsonb/);
    expect(up).toMatch(/"trackingToken" varchar\(32\)/);
    expect(up).toMatch(
      /UQ_catalogue_orders_tracking_token.*WHERE "trackingToken" IS NOT NULL/,
    );
    expect(up).toMatch(/"tipAmount" numeric\(12,2\) NOT NULL DEFAULT 0/);
    expect(up).toMatch(/"rating" smallint/);
    expect(up).toMatch(/"payer" varchar\(60\)/);

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map(([sql]) => sql).join('\n');
    for (const column of [
      'payer',
      'tipAmount',
      'rating',
      'statusTimeline',
      'trackingToken',
    ]) {
      expect(down).toContain(`DROP COLUMN IF EXISTS "${column}"`);
    }
  });
});
