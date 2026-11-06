import { PosChargesAndSessionLink1816000000000 } from './migrations/1816000000000-PosChargesAndSessionLink';

describe('PosChargesAndSessionLink migration', () => {
  it('adds the charge columns to both sale tables and links sales to a session', async () => {
    const query = jest.fn<Promise<void>, [string]>();
    const migration = new PosChargesAndSessionLink1816000000000();
    await migration.up({ query } as never);
    const up = query.mock.calls.map(([sql]) => sql).join('\n');
    for (const table of ['pos_sales', 'pos_held_sales']) {
      expect(up).toContain(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "serviceCharge"`,
      );
    }
    expect(up).toMatch(/"packagingFee" numeric\(12,2\)/);
    expect(up).toMatch(/"orderType" varchar\(16\) NOT NULL DEFAULT 'dine_in'/);
    expect(up).toMatch(/"registerSessionId" uuid/);
    expect(up).toMatch(
      /REFERENCES "pos_register_sessions"\("id"\) ON DELETE SET NULL/,
    );

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map(([sql]) => sql).join('\n');
    expect(down).toContain('DROP COLUMN IF EXISTS "registerSessionId"');
    expect(down).toContain('DROP COLUMN IF EXISTS "serviceCharge"');
  });
});
