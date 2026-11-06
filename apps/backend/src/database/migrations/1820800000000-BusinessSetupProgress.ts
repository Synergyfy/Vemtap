import { MigrationInterface, QueryRunner } from 'typeorm';

/** An owner's unfinished business setup, so sign-up resumes on any device. */
export class BusinessSetupProgress1820800000000 implements MigrationInterface {
  name = 'BusinessSetupProgress1820800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "businessSetupProgress" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "businessSetupProgress"`,
    );
  }
}
