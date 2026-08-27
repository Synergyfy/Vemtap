import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRenewalReminderColumns1787100000000 implements MigrationInterface {
  name = 'AddRenewalReminderColumns1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "lastRenewalReminderAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "lastRenewalReminderStage" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "actionUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "actionUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "lastRenewalReminderStage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "lastRenewalReminderAt"`,
    );
  }
}
