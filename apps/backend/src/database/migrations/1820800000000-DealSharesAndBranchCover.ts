import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema for the branch cover image, deal share counts and the deal share log,
 * which the entities gained in the `logic` merge without a migration.
 * Constraint and index names match what TypeORM generates for the entities.
 */
export class DealSharesAndBranchCover1820800000000 implements MigrationInterface {
  name = 'DealSharesAndBranchCover1820800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "coverUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "sharesCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "deal_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "userId" uuid, "platform" character varying(50), "ipHash" character varying(45), CONSTRAINT "PK_b917cdcdd58e36279a3f1202c40" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1c22a046b9d177025c2d0d877d" ON "deal_shares" ("offerId")`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_1c22a046b9d177025c2d0d877d1') THEN
          ALTER TABLE "deal_shares" ADD CONSTRAINT "FK_1c22a046b9d177025c2d0d877d1" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a991d606ccc419c03749a690851') THEN
          ALTER TABLE "deal_shares" ADD CONSTRAINT "FK_a991d606ccc419c03749a690851" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deal_shares"`);
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN IF EXISTS "sharesCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "coverUrl"`,
    );
  }
}
