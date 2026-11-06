import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ad wallet payments: one saved card per business (Paystack reusable
 * authorization, kept only with the owner's consent) and auto-reload
 * settings that top the wallet up from that card when it runs low.
 *
 * - `cardAuthorizationCode`: the reusable authorization; never returned by
 *   the API.
 * - `cardEmail`: the Paystack customer email the authorization belongs to
 *   (charges must use it); never returned by the API.
 * - `cardSummary`: brand / last4 / expiry / bank, for display.
 * - `autoReload`: { enabled, threshold, amount, lastAttemptAt, lastError }.
 */
export class AdWalletSavedCard1814000000000 implements MigrationInterface {
  name = 'AdWalletSavedCard1814000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ad_wallets"
        ADD COLUMN IF NOT EXISTS "cardAuthorizationCode" varchar(128),
        ADD COLUMN IF NOT EXISTS "cardEmail" varchar(255),
        ADD COLUMN IF NOT EXISTS "cardSummary" jsonb,
        ADD COLUMN IF NOT EXISTS "autoReload" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ad_wallets"
        DROP COLUMN IF EXISTS "autoReload",
        DROP COLUMN IF EXISTS "cardSummary",
        DROP COLUMN IF EXISTS "cardEmail",
        DROP COLUMN IF EXISTS "cardAuthorizationCode"
    `);
  }
}
