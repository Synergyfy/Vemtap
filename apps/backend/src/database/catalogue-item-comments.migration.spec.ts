import { CatalogueItemComments1819600000000 } from './migrations/1819600000000-CatalogueItemComments';

describe('CatalogueItemComments migration', () => {
  it('creates the table, its indexes and the one-live-comment rule', async () => {
    const query = jest.fn();
    const migration = new CatalogueItemComments1819600000000();
    await migration.up({ query } as never);
    const sql = (query.mock.calls as string[][])
      .map(([text]) => text)
      .join('\n');
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "catalogue_item_comments"',
    );
    expect(sql).toContain(
      'REFERENCES "catalogue_items"("id") ON DELETE CASCADE',
    );
    expect(sql).toContain('"rating" BETWEEN 1 AND 5');
    expect(sql).toMatch(
      /UNIQUE INDEX .* \("itemId", "userId"\) WHERE "deletedAt" IS NULL/,
    );

    query.mockClear();
    await migration.down({ query } as never);
    expect(query).toHaveBeenCalledWith(
      'DROP TABLE IF EXISTS "catalogue_item_comments"',
    );
  });
});
