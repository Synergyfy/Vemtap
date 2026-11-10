import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The referral programme video an admin sets once for every customer and
 * business referral page (until now it lived in one admin's browser storage).
 */
export class SettingsReferralVideoUrl1821200000000 implements MigrationInterface {
  name = 'SettingsReferralVideoUrl1821200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "referralVideoUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "referralVideoUrl"`,
    );
  }
}
