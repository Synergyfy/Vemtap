import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategorySlug1780500000001 implements MigrationInterface {
  name = 'AddCategorySlug1780500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "marketing_categories" ADD "slug" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `UPDATE "marketing_categories" SET "slug" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_categories" ADD CONSTRAINT "UQ_marketing_categories_slug" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "marketing_categories" DROP CONSTRAINT IF EXISTS "UQ_marketing_categories_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_categories" DROP COLUMN "slug"`,
    );
  }
}
