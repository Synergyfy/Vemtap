import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Audit trail for self-service account deletion: one row per deleted account,
 * kept after the user row is anonymised and soft-deleted.
 */
export class AccountDeletionRequests1819800000000 implements MigrationInterface {
  name = 'AccountDeletionRequests1819800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "account_deletion_requests" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
         "deletedAt" TIMESTAMP,
         "userId" uuid NOT NULL,
         "role" character varying NOT NULL,
         "reasonId" character varying,
         "feedback" text,
         "status" character varying NOT NULL DEFAULT 'completed',
         "completedAt" TIMESTAMP NOT NULL,
         CONSTRAINT "PK_account_deletion_requests" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_account_deletion_requests_user" ON "account_deletion_requests" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_deletion_requests"`);
  }
}
