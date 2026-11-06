import { CatalogueItemLikes1819700000000 } from './migrations/1819700000000-CatalogueItemLikes';

describe('CatalogueItemLikes migration', () => {
  it('creates the table with one like per customer per item', async () => {
    const query = jest.fn();
    const migration = new CatalogueItemLikes1819700000000();
    await migration.up({ query } as never);
    const sql = (query.mock.calls as string[][])
      .map(([text]) => text)
      .join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "catalogue_item_likes"');
    expect(sql).toContain('UNIQUE ("itemId", "userId")');
    expect(sql).toContain(
      'REFERENCES "catalogue_items"("id") ON DELETE CASCADE',
    );

    query.mockClear();
    await migration.down({ query } as never);
    expect(query).toHaveBeenCalledWith(
      'DROP TABLE IF EXISTS "catalogue_item_likes"',
    );
  });
});
