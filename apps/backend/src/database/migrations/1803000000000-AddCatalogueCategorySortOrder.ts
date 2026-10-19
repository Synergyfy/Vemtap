import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives catalogue categories an explicit display order.
 *
 * The hub's re-order affordance previously had nothing to persist to: lists
 * were sorted by name only. sortOrder drives both the admin category list and
 * the branch-scoped (customer menu) category order; 0 with a name tie-break
 * preserves today's alphabetical behaviour for existing rows.
 */
export class AddCatalogueCategorySortOrder1803000000000 implements MigrationInterface {
  name = 'AddCatalogueCategorySortOrder1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" ADD COLUMN "sortOrder" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" DROP COLUMN "sortOrder"`,
    );
  }
}
