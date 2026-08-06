import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityFields20260804120000 implements MigrationInterface {
  name = 'AddUserSecurityFields20260804120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorEnabled" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorSecret" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorSecret"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorEnabled"`);
  }
}
