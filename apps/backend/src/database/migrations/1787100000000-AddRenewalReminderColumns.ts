import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRenewalReminderColumns1787100000000 implements MigrationInterface {
  name = 'AddRenewalReminderColumns1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotent guards: this migration can be run against a database where
    // the columns were already provisioned out-of-band (e.g. via synchronize),
    // and it must never block the migration queue for other deployments.
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lastRenewalReminderAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lastRenewalReminderStage" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "actionUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "lastRenewalReminderStage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "lastRenewalReminderAt"`,
    );
  }
}
