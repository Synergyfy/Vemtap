import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer comments on catalogue products, with the business's public reply.
 * One live comment per customer per item: the unique index skips soft-deleted
 * rows so a customer can comment again after deleting.
 */
export class CatalogueItemComments1819600000000 implements MigrationInterface {
  name = 'CatalogueItemComments1819600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "catalogue_item_comments" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
         "deletedAt" TIMESTAMP,
         "itemId" uuid NOT NULL,
         "businessId" uuid NOT NULL,
         "userId" uuid,
         "authorName" character varying(80) NOT NULL,
         "comment" text NOT NULL,
         "rating" integer,
         "merchantReply" text,
         "repliedAt" TIMESTAMP,
         "repliedById" uuid,
         CONSTRAINT "PK_catalogue_item_comments" PRIMARY KEY ("id"),
         CONSTRAINT "CHK_catalogue_item_comments_rating" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5),
         CONSTRAINT "FK_catalogue_item_comments_item" FOREIGN KEY ("itemId")
           REFERENCES "catalogue_items"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_catalogue_item_comments_user" FOREIGN KEY ("userId")
           REFERENCES "users"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_item_comments_item" ON "catalogue_item_comments" ("itemId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_item_comments_business" ON "catalogue_item_comments" ("businessId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_item_comments_user" ON "catalogue_item_comments" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_catalogue_item_comments_item_user" ON "catalogue_item_comments" ("itemId", "userId") WHERE "deletedAt" IS NULL AND "userId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalogue_item_comments"`);
  }
}
