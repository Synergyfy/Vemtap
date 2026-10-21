import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Campaign delivery: the email subject line, and the customers a scheduled
 * campaign will be sent to when it falls due.
 */
export class CampaignDelivery1820100000000 implements MigrationInterface {
  name = 'CampaignDelivery1820100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "subject" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "recipientIds" jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_campaigns_due" ON "campaigns" ("scheduledFor") WHERE "status" = 'Scheduled'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_campaigns_due"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "recipientIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "subject"`,
    );
  }
}
