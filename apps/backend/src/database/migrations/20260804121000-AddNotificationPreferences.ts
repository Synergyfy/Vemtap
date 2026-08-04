import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences20260804121000 implements MigrationInterface {
  name = 'AddNotificationPreferences20260804121000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "notificationPreferences" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notificationPreferences"`);
  }
}
