import { DistrictTargeting1818500000000 } from './migrations/1818500000000-DistrictTargeting';

describe('DistrictTargeting migration', () => {
  it('adds the district cluster type and a nullable home district on users', async () => {
    const query = jest.fn();
    const migration = new DistrictTargeting1818500000000();
    await migration.up({ query } as never);
    const sql = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(sql).toContain(
      `ALTER TYPE "public"."clusters_type_enum" ADD VALUE IF NOT EXISTS 'district'`,
    );
    expect(sql).toMatch(/"homeDistrictId" uuid(?! NOT NULL)/);
    expect(sql).toMatch(/REFERENCES "clusters"\("id"\) ON DELETE SET NULL/);
    // Seeding uses the new value, so it must not happen in this transaction.
    expect(sql).not.toMatch(/INSERT INTO "clusters"/);

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(down).toContain('DROP COLUMN IF EXISTS "homeDistrictId"');
  });
});
