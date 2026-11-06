import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Live POS orders, tips and split bills.
 *
 * - `catalogue_orders.statusTimeline`: when each status was reached, for the
 *   kitchen stream's prep times and the guest tracking timeline.
 * - `catalogue_orders.trackingToken`: unguessable handle a guest uses to
 *   follow an order without logging in.
 * - `pos_sales.tipAmount` / `rating`: from the customer-facing display.
 * - `pos_split_payments.payer`: who paid this part of a split bill.
 */
export class PosLiveOrdersTipsSplit1818000000000 implements MigrationInterface {
  name = 'PosLiveOrdersTipsSplit1818000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD COLUMN IF NOT EXISTS "statusTimeline" jsonb, ADD COLUMN IF NOT EXISTS "trackingToken" varchar(32)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_catalogue_orders_tracking_token" ON "catalogue_orders" ("trackingToken") WHERE "trackingToken" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD COLUMN IF NOT EXISTS "tipAmount" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "rating" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_split_payments" ADD COLUMN IF NOT EXISTS "payer" varchar(60)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_split_payments" DROP COLUMN IF EXISTS "payer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP COLUMN IF EXISTS "tipAmount", DROP COLUMN IF EXISTS "rating"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_catalogue_orders_tracking_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN IF EXISTS "statusTimeline", DROP COLUMN IF EXISTS "trackingToken"`,
    );
  }
}
