import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer invite links (`/join/{business}?invite=TOKEN`): one row per issued
 * link with its expiry and how many people joined through it.
 */
export class CustomerInvites1819900000000 implements MigrationInterface {
  name = 'CustomerInvites1819900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "customer_invites" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
         "deletedAt" TIMESTAMP,
         "businessId" uuid NOT NULL,
         "createdById" uuid NOT NULL,
         "token" character varying NOT NULL,
         "channels" text,
         "expiresAt" TIMESTAMP NOT NULL,
         "revokedAt" TIMESTAMP,
         "registrations" integer NOT NULL DEFAULT 0,
         CONSTRAINT "PK_customer_invites" PRIMARY KEY ("id"),
         CONSTRAINT "FK_customer_invites_business" FOREIGN KEY ("businessId")
           REFERENCES "businesses"("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_invites_token" ON "customer_invites" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_invites_business" ON "customer_invites" ("businessId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_invites"`);
  }
}
