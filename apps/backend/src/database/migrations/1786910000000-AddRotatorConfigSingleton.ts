import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRotatorConfigSingleton1786910000000 implements MigrationInterface {
  name = 'AddRotatorConfigSingleton1786910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Deduplicate first (keep the earliest row) so the singleton index
    // below never fails on an existing double-created row.
    await queryRunner.query(
      `DELETE FROM "rotator_configs" WHERE "id" NOT IN (SELECT "id" FROM "rotator_configs" ORDER BY "createdAt" ASC, "id" ASC LIMIT 1)`,
    );
    // Expression unique index on a constant: at most one row can exist,
    // enforced by the database (not just by an app-level check-and-insert).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_rotator_configs_singleton" ON "rotator_configs" ((1)) `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_rotator_configs_singleton"`,
    );
  }
}
