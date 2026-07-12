import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscoverySettingsColumns1783792876160 implements MigrationInterface {
  name = 'AddDiscoverySettingsColumns1783792876160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryEnableNetwork" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryEnableSponsored" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryEnablePartnerships" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryMaxOffersPerVisit" integer NOT NULL DEFAULT 3`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryMaxOffersPerDay" integer NOT NULL DEFAULT 5`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryDefaultRadius" integer NOT NULL DEFAULT 500`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryMaxRadius" integer NOT NULL DEFAULT 2000`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryAttributionWindow" integer NOT NULL DEFAULT 24`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryPushEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoverySmsEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryEmailEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "discoveryApprovalRequired" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryApprovalRequired"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryEmailEnabled"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoverySmsEnabled"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryPushEnabled"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryAttributionWindow"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryMaxRadius"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryDefaultRadius"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryMaxOffersPerDay"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryMaxOffersPerVisit"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryEnablePartnerships"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryEnableSponsored"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "discoveryEnableNetwork"`);
  }
}
