import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer likes on catalogue products and services: one row per customer per
 * item, removed on unlike.
 */
export class CatalogueItemLikes1819700000000 implements MigrationInterface {
  name = 'CatalogueItemLikes1819700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "catalogue_item_likes" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
         "deletedAt" TIMESTAMP,
         "itemId" uuid NOT NULL,
         "userId" uuid NOT NULL,
         CONSTRAINT "PK_catalogue_item_likes" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_catalogue_item_likes_item_user" UNIQUE ("itemId", "userId"),
         CONSTRAINT "FK_catalogue_item_likes_item" FOREIGN KEY ("itemId")
           REFERENCES "catalogue_items"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_catalogue_item_likes_user" FOREIGN KEY ("userId")
           REFERENCES "users"("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_item_likes_item" ON "catalogue_item_likes" ("itemId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_item_likes_user" ON "catalogue_item_likes" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalogue_item_likes"`);
  }
}
