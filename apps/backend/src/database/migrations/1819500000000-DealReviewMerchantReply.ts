import { MigrationInterface, QueryRunner } from 'typeorm';

/** A business's public reply to a deal review, and who wrote it when. */
export class DealReviewMerchantReply1819500000000 implements MigrationInterface {
  name = 'DealReviewMerchantReply1819500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_reviews"
         ADD COLUMN IF NOT EXISTS "merchantReply" text,
         ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP,
         ADD COLUMN IF NOT EXISTS "repliedById" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_reviews"
         DROP COLUMN IF EXISTS "repliedById",
         DROP COLUMN IF EXISTS "repliedAt",
         DROP COLUMN IF EXISTS "merchantReply"`,
    );
  }
}
