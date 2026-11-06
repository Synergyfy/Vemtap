import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Views and taps of boosted / promoted deals shown to consumers. One row per
 * viewer, campaign, kind and hour (the unique index), so a viewer scrolling
 * past the same card again within the hour is not counted twice.
 */
export class SponsoredCampaignEvents1815000000000 implements MigrationInterface {
  name = 'SponsoredCampaignEvents1815000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sponsored_campaign_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "offerId" uuid NOT NULL,
        "type" varchar(16) NOT NULL,
        "viewerKey" varchar(64) NOT NULL,
        "customerId" uuid,
        "hourBucket" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsored_campaign_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sponsored_campaign_events_campaign" FOREIGN KEY ("campaignId")
          REFERENCES "sponsored_campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sponsored_campaign_events_viewer_hour"
        ON "sponsored_campaign_events" ("campaignId", "type", "viewerKey", "hourBucket")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sponsored_campaign_events_campaign_time"
        ON "sponsored_campaign_events" ("campaignId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sponsored_campaign_events_campaign_time"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_sponsored_campaign_events_viewer_hour"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "sponsored_campaign_events"`);
  }
}
