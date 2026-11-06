import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets a session renew its access token: a hash of its current and previous
 * refresh tokens, and the claims the next access token should carry.
 */
export class UserSessionRefreshToken1821200000000 implements MigrationInterface {
  name = 'UserSessionRefreshToken1821200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_sessions"
        ADD COLUMN IF NOT EXISTS "refreshTokenHash" varchar,
        ADD COLUMN IF NOT EXISTS "previousRefreshTokenHash" varchar,
        ADD COLUMN IF NOT EXISTS "refreshRotatedAt" timestamp,
        ADD COLUMN IF NOT EXISTS "refreshExpiresAt" timestamp,
        ADD COLUMN IF NOT EXISTS "tokenClaims" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_sessions"
        DROP COLUMN IF EXISTS "tokenClaims",
        DROP COLUMN IF EXISTS "refreshExpiresAt",
        DROP COLUMN IF EXISTS "refreshRotatedAt",
        DROP COLUMN IF EXISTS "previousRefreshTokenHash",
        DROP COLUMN IF EXISTS "refreshTokenHash"
    `);
  }
}
