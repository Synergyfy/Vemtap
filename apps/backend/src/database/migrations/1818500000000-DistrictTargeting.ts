import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Districts are clusters of a new `district` type (Wuse 2, Maitama…) that
 * boosts, campaigns and segments target, and a consumer's home district is the
 * area they chose in the app.
 *
 * The default districts are seeded by `ClustersService.ensureDefaultDistricts`
 * at startup, not here: Postgres will not use an enum value in the transaction
 * that added it, and the CLI runs every pending migration in one transaction.
 */
export class DistrictTargeting1818500000000 implements MigrationInterface {
  name = 'DistrictTargeting1818500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."clusters_type_enum" ADD VALUE IF NOT EXISTS 'district'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "homeDistrictId" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_home_district" FOREIGN KEY ("homeDistrictId")
        REFERENCES "clusters"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_home_district" ON "users" ("homeDistrictId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_home_district"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_home_district"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "homeDistrictId"`,
    );
    // Postgres cannot drop an enum value; any district rows would block it
    // anyway. `district` stays in clusters_type_enum.
  }
}
