import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityFields1785844800000 implements MigrationInterface {
  name = 'AddUserSecurityFields1785844800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorSecret" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorSecret"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorEnabled"`);
  }
}
