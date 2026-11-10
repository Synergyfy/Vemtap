import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Platform parameters the admin Platform Settings page edits (tax rates, POS take
 * rate, escrow hold, geofence defaults and operational switches). Stored only;
 * nothing enforces them yet.
 */
export class SettingsPlatformParameters1821200000001 implements MigrationInterface {
  name = 'SettingsPlatformParameters1821200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "platformCurrencySymbol" character varying(20) NOT NULL DEFAULT '₦ (NGN)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "platformVatRate" numeric(5,2) NOT NULL DEFAULT 7.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "withholdingTaxRate" numeric(5,2) NOT NULL DEFAULT 5.0`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "defaultPosTakeRate" numeric(5,2) NOT NULL DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "escrowHoldingHours" integer NOT NULL DEFAULT 24`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "defaultGeofenceRadiusMeters" integer NOT NULL DEFAULT 2000`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maxClustersPerMerchant" integer NOT NULL DEFAULT 10`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "nfcHeartbeatIntervalSec" integer NOT NULL DEFAULT 45`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceMode" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "strictKybGate" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "dualAuthorizerEscrow" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "autoDunningActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsGatewayFallback" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "realtimeTelemetryRateLimit" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "platformCurrencySymbol"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "platformVatRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "withholdingTaxRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "defaultPosTakeRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "escrowHoldingHours"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "defaultGeofenceRadiusMeters"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "maxClustersPerMerchant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "nfcHeartbeatIntervalSec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "maintenanceMode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "strictKybGate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "dualAuthorizerEscrow"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "autoDunningActive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "smsGatewayFallback"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "realtimeTelemetryRateLimit"`,
    );
  }
}
