import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiWalletCredits1785000426098 implements MigrationInterface {
  name = 'AddAiWalletCredits1785000426098';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD IF NOT EXISTS "creditPriceAi" numeric(10,2) NOT NULL DEFAULT '50.00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credit_wallets" ADD IF NOT EXISTS "aiCredits" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_plans" ADD IF NOT EXISTS "aiAmount" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credit_plans" DROP COLUMN IF EXISTS "aiAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credit_wallets" DROP COLUMN IF EXISTS "aiCredits"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN IF EXISTS "creditPriceAi"`,
    );
  }
}
