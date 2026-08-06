import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogueOfferExtendedFields1784999888630 implements MigrationInterface {
  name = 'AddCatalogueOfferExtendedFields1784999888630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "terms" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "claimCodePrefix" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "maxClaimsPerCustomer" integer DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "audienceTarget" character varying DEFAULT 'all'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "audienceTarget"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "maxClaimsPerCustomer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "claimCodePrefix"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "terms"`,
    );
  }
}
