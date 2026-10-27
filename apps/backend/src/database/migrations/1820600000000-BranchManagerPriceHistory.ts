import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Branch manager contact and district (collected on the add-branch form), and
 * the history of per-branch deal price changes.
 */
export class BranchManagerPriceHistory1820600000000 implements MigrationInterface {
  name = 'BranchManagerPriceHistory1820600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "managerName" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "managerEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "managerPhone" character varying(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "district" character varying(160)`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offer_price_changes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "businessId" uuid NOT NULL,
        "dealGroupId" uuid NOT NULL,
        "offerId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "branchName" character varying(255),
        "oldPrice" numeric(12,2) NOT NULL,
        "newPrice" numeric(12,2) NOT NULL,
        "changedById" uuid,
        CONSTRAINT "PK_offer_price_changes" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_price_changes_group" ON "offer_price_changes" ("businessId", "dealGroupId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_offer_price_changes_group"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "offer_price_changes"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "district"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "managerPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "managerEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "managerName"`,
    );
  }
}
