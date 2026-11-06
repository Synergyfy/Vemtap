import { SponsoredCampaignEvents1815000000000 } from './migrations/1815000000000-SponsoredCampaignEvents';

describe('SponsoredCampaignEvents migration', () => {
  it('creates the events table with one row per viewer, kind and hour', async () => {
    const query = jest.fn();
    const migration = new SponsoredCampaignEvents1815000000000();
    await migration.up({ query } as never);
    const sql = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "sponsored_campaign_events"',
    );
    expect(sql).toMatch(/"viewerKey" varchar\(64\) NOT NULL/);
    expect(sql).toMatch(
      /UNIQUE INDEX[^(]+\("campaignId", "type", "viewerKey", "hourBucket"\)/,
    );
    expect(sql).toContain('ON DELETE CASCADE');

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(down).toContain('DROP TABLE IF EXISTS "sponsored_campaign_events"');
  });
});
