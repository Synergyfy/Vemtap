import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A user's own shareable referral code (`myReferralCode`), separate from
 * `referralCode` which records "the code this account signed up with".
 */
export class UserOwnReferralCode1820900000000 implements MigrationInterface {
  name = 'UserOwnReferralCode1820900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "myReferralCode" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_my_referral_code" ON "users" ("myReferralCode")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_my_referral_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "myReferralCode"`,
    );
  }
}
