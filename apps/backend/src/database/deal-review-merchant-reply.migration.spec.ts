import { DealReviewMerchantReply1819500000000 } from './migrations/1819500000000-DealReviewMerchantReply';

describe('DealReviewMerchantReply migration', () => {
  it('adds the reply columns and drops them on down', async () => {
    const query = jest.fn();
    const migration = new DealReviewMerchantReply1819500000000();
    await migration.up({ query } as never);
    const sql = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "merchantReply" text');
    expect(sql).toContain('"repliedAt" TIMESTAMP');
    expect(sql).toContain('"repliedById" uuid');

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(down).toContain('DROP COLUMN IF EXISTS "merchantReply"');
  });
});
