import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1785845400000 implements MigrationInterface {
  name = 'AddNotificationPreferences1785845400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "notificationPreferences"`,
    );
  }
}
