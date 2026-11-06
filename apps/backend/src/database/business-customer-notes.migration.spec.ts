import { BusinessCustomerNotes1819000000000 } from './migrations/1819000000000-BusinessCustomerNotes';

describe('BusinessCustomerNotes migration', () => {
  it('creates one note row per business and customer, and drops it on down', async () => {
    const query = jest.fn();
    const migration = new BusinessCustomerNotes1819000000000();
    await migration.up({ query } as never);
    const sql = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "business_customer_notes"',
    );
    expect(sql).toMatch(/"tags" text\[\] NOT NULL DEFAULT '\{\}'/);
    expect(sql).toMatch(/UNIQUE INDEX[^(]+\("businessId", "userId"\)/);
    expect(sql.match(/ON DELETE CASCADE/g)).toHaveLength(2);

    query.mockClear();
    await migration.down({ query } as never);
    const down = query.mock.calls.map((call) => call[0] as string).join('\n');
    expect(down).toContain('DROP TABLE IF EXISTS "business_customer_notes"');
  });
});
