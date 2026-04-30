import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogueConfig1774865271928 implements MigrationInterface {
  name = 'AddCatalogueConfig1774865271928';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "isCatalogueEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "catalogueEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "maxCatalogueItems" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "maxCatalogueCategories" integer`,
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
      `ALTER TABLE "plans" DROP COLUMN "maxCatalogueCategories"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "maxCatalogueItems"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "catalogueEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "isCatalogueEnabled"`,
    );
  }
}
