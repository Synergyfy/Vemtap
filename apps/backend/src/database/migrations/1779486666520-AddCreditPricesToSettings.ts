import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditPricesToSettings1779486666520 implements MigrationInterface {
  name = 'AddCreditPricesToSettings1779486666520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "creditPriceSms" numeric(10,2) NOT NULL DEFAULT '15'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "creditPriceWhatsapp" numeric(10,2) NOT NULL DEFAULT '25'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "creditPriceEmail" numeric(10,2) NOT NULL DEFAULT '2'`,
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
      `ALTER TABLE "settings" DROP COLUMN "creditPriceEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "creditPriceWhatsapp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "creditPriceSms"`,
    );
  }
}
