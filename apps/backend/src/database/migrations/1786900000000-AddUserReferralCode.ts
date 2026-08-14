import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserReferralCode1786900000000 implements MigrationInterface {
  name = 'AddUserReferralCode1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "referralCode" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referralCode"`);
  }
}
