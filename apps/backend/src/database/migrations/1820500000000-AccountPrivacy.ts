import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NDPR controls: a business's processing choices, a user's security choices
 * (new-device alerts) and the data-subject requests made from settings.
 */
export class AccountPrivacy1820500000000 implements MigrationInterface {
  name = 'AccountPrivacy1820500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "privacySettings" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "securityPreferences" jsonb`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "businessId" uuid,
        "type" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL,
        "reference" character varying(20) NOT NULL,
        "details" text,
        "dueAt" TIMESTAMP NOT NULL,
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_data_requests" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_data_requests_user" ON "data_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_data_requests_business" ON "data_requests" ("businessId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "data_requests"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "securityPreferences"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN IF EXISTS "privacySettings"`,
    );
  }
}
