import { AdWalletSavedCard1814000000000 } from './migrations/1814000000000-AdWalletSavedCard';

describe('AdWalletSavedCard migration', () => {
  it('adds and removes the saved-card and auto-reload columns', async () => {
    const query = jest.fn();
    const migration = new AdWalletSavedCard1814000000000();
    await migration.up({ query } as never);
    const up = query.mock.calls[0][0] as string;
    expect(up).toMatch(/"cardAuthorizationCode" varchar\(128\)/);
    expect(up).toMatch(/"cardEmail" varchar\(255\)/);
    expect(up).toMatch(/"cardSummary" jsonb/);
    expect(up).toMatch(/"autoReload" jsonb/);

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls[0][0] as string;
    for (const column of [
      'cardAuthorizationCode',
      'cardEmail',
      'cardSummary',
      'autoReload',
    ]) {
      expect(down).toContain(`DROP COLUMN IF EXISTS "${column}"`);
    }
  });
});
