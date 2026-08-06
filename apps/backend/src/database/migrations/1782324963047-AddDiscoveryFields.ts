import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscoveryFields1782324963047 implements MigrationInterface {
  name = 'AddDiscoveryFields1782324963047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "joinDiscoveryNetwork" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "receivePartnerRequests" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "allowPromotions" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "pushNotifications" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "smsAlerts" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "emailSummary" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "startDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "endDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "offerType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "audience" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "views" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "visits" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "revenue" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "referredByBranchId" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "visits" ADD "catalogueOfferId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_50ebb299a2ae9ab46872a494fd1" FOREIGN KEY ("referredByBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_6c3ed84fa36787a2e6e48ccf5f3" FOREIGN KEY ("catalogueOfferId") REFERENCES "catalogue_offers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_6c3ed84fa36787a2e6e48ccf5f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_50ebb299a2ae9ab46872a494fd1"`,
    );
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
      `ALTER TABLE "visits" DROP COLUMN "catalogueOfferId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP COLUMN "referredByBranchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "revenue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "visits"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "views"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "audience"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "offerType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "endDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "emailSummary"`,
    );
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "smsAlerts"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "pushNotifications"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "allowPromotions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "receivePartnerRequests"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "joinDiscoveryNetwork"`,
    );
  }
}
