import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * POS tax and surcharges, and the shift a sale belongs to.
 *
 * - `pos_sales` / `pos_held_sales`: `serviceCharge`, `packagingFee` and
 *   `orderType` (dine_in | takeaway), so a ticket keeps the charges it was rung
 *   up with even after the business changes its settings.
 * - `pos_sales.registerSessionId`: the open cashier session at sale time, so a
 *   shift ledger is one indexed filter instead of a time-window guess.
 */
export class PosChargesAndSessionLink1816000000000 implements MigrationInterface {
  name = 'PosChargesAndSessionLink1816000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['pos_sales', 'pos_held_sales']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "serviceCharge" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "packagingFee" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "orderType" varchar(16) NOT NULL DEFAULT 'dine_in'`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD COLUMN IF NOT EXISTS "registerSessionId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD CONSTRAINT "FK_pos_sales_register_session" FOREIGN KEY ("registerSessionId") REFERENCES "pos_register_sessions"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_sales_register_session" ON "pos_sales" ("registerSessionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pos_sales_register_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP CONSTRAINT IF EXISTS "FK_pos_sales_register_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP COLUMN IF EXISTS "registerSessionId"`,
    );
    for (const table of ['pos_sales', 'pos_held_sales']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "serviceCharge", DROP COLUMN IF EXISTS "packagingFee", DROP COLUMN IF EXISTS "orderType"`,
      );
    }
  }
}
