import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountToCatalogueItems1774704215721 implements MigrationInterface {
  name = 'AddDiscountToCatalogueItems1774704215721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_items_discounttype_enum" AS ENUM('percentage', 'fixed', 'none')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "discountType" "public"."catalogue_items_discounttype_enum" NOT NULL DEFAULT 'none'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "discountValue" numeric(12,2)`,
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
      `ALTER TABLE "catalogue_items" DROP COLUMN "discountValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "discountType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_items_discounttype_enum"`,
    );
  }
}
