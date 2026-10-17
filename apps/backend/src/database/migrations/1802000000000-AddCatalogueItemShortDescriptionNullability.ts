import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets a catalogue item be created without a short description.
 *
 * The API contract (CreateCatalogueItemDto) treats shortDescription as
 * optional, but the column was NOT NULL, so any client that omitted it —
 * including the app's product/service create flows — hit a 500 at insert
 * time. Nullable so the column matches the contract; existing rows are
 * untouched.
 */
export class AddCatalogueItemShortDescriptionNullability1802000000000 implements MigrationInterface {
  name = 'AddCatalogueItemShortDescriptionNullability1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ALTER COLUMN "shortDescription" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "catalogue_items" SET "shortDescription" = '' WHERE "shortDescription" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ALTER COLUMN "shortDescription" SET NOT NULL`,
    );
  }
}
