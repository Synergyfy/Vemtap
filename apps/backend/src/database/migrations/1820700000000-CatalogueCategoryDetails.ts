import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalogue category type, description, icon and image, which the web
 * category form already collects.
 */
export class CatalogueCategoryDetails1820700000000 implements MigrationInterface {
  name = 'CatalogueCategoryDetails1820700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" ADD COLUMN IF NOT EXISTS "kind" character varying(20) NOT NULL DEFAULT 'product'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" ADD COLUMN IF NOT EXISTS "icon" character varying(60)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" ADD COLUMN IF NOT EXISTS "imageUrl" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['imageUrl', 'icon', 'description', 'kind']) {
      await queryRunner.query(
        `ALTER TABLE "catalogue_categories" DROP COLUMN IF EXISTS "${column}"`,
      );
    }
  }
}
