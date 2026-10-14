import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Free trials no longer take a card or auto-charge (they fall back to the
 * free plan when they end), so the subscription gains:
 *
 * - `trialReminderStage`: the last "trial ends in N days" notice sent (3, 1),
 *   kept apart from `lastRenewalReminderStage`, which the paid-renewal
 *   reminders own.
 * - `cardSummary`: display details (brand, last4, expiry, bank) of the card a
 *   paid subscription was bought with, for the billing screen.
 */
export class CardlessTrial1811000000000 implements MigrationInterface {
  name = 'CardlessTrial1811000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        ADD COLUMN "trialReminderStage" integer,
        ADD COLUMN "cardSummary" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        DROP COLUMN "cardSummary",
        DROP COLUMN "trialReminderStage"
    `);
  }
}
