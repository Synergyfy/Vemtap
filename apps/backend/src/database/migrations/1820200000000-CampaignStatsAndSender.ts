import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Campaign tracking and sender identity: the promoted link (clicks are counted
 * through `/c/:id`), the email sender name and reply-to, and the messaging
 * engine campaign whose messages hold the delivery statuses.
 */
export class CampaignStatsAndSender1820200000000 implements MigrationInterface {
  name = 'CampaignStatsAndSender1820200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "link" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "senderName" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "replyTo" character varying(254)`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "messageCampaignId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of [
      'messageCampaignId',
      'replyTo',
      'senderName',
      'link',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "${column}"`,
      );
    }
  }
}
