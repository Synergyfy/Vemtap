import { PosTillsPinsPeripherals1817000000000 } from './migrations/1817000000000-PosTillsPinsPeripherals';

describe('PosTillsPinsPeripherals migration', () => {
  it('creates the POS tables and links sessions to a till, and drops them in reverse', async () => {
    const query = jest.fn<Promise<void>, [string]>();
    const migration = new PosTillsPinsPeripherals1817000000000();
    await migration.up({ query } as never);
    const up = query.mock.calls.map(([sql]) => sql).join('\n');
    for (const table of [
      'pos_tills',
      'pos_staff_pins',
      'pos_override_logs',
      'pos_peripherals',
    ]) {
      expect(up).toContain(`CREATE TABLE IF NOT EXISTS "${table}"`);
    }
    expect(up).toMatch(/UQ_pos_tills_business_code.*WHERE "deletedAt" IS NULL/);
    expect(up).toMatch(
      /UQ_pos_staff_pins_business_user.*WHERE "deletedAt" IS NULL/,
    );
    expect(up).toContain(
      'ALTER TABLE "pos_register_sessions" ADD COLUMN IF NOT EXISTS "tillId" uuid',
    );

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map(([sql]) => sql);
    expect(down[0]).toContain('DROP TABLE IF EXISTS "pos_peripherals"');
    expect(down[down.length - 1]).toContain('DROP TABLE IF EXISTS "pos_tills"');
  });
});
