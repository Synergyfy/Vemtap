import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The shell (`customer` or `business`) a dual-role account last used, so
 * signing in on any browser or device can return them to it.
 */
export class UserLastActiveShell1821000000000 implements MigrationInterface {
  name = 'UserLastActiveShell1821000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastActiveShell" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "lastActiveShell"`,
    );
  }
}
