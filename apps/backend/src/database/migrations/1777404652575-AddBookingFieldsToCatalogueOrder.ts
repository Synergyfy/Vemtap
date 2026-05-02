import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingFieldsToCatalogueOrder1777404652575 implements MigrationInterface {
  name = 'AddBookingFieldsToCatalogueOrder1777404652575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "bookingDate" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "bookingTime" character varying`,
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
      `ALTER TABLE "catalogue_orders" DROP COLUMN "bookingTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "bookingDate"`,
    );
  }
}
