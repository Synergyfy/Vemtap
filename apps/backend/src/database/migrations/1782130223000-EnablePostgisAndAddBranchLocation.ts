import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgisAndAddBranchLocation1782130223000 implements MigrationInterface {
  name = 'EnablePostgisAndAddBranchLocation1782130223000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7) NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7) NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326)`,
    );

    await queryRunner.query(
      `UPDATE "branches" SET "location" = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE latitude IS NOT NULL AND longitude IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_branches_location" ON "branches" USING GIST ("location")`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_branch_location()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
        ELSE
          NEW.location = NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_branches_location ON branches`,
    );

    await queryRunner.query(`
      CREATE TRIGGER trg_branches_location
        BEFORE INSERT OR UPDATE OF latitude, longitude ON branches
        FOR EACH ROW EXECUTE FUNCTION update_branch_location()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_branches_location ON branches`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_branch_location()`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_branches_location"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "location"`,
    );
  }
}
