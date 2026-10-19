import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Private CRM notes and tags a business keeps on its customers: one row per
 * business and customer, editable from the customer dossier.
 */
export class BusinessCustomerNotes1819000000000 implements MigrationInterface {
  name = 'BusinessCustomerNotes1819000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "business_customer_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "businessId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "note" text NOT NULL DEFAULT '',
        "tags" text[] NOT NULL DEFAULT '{}',
        "updatedById" uuid,
        CONSTRAINT "PK_business_customer_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_business_customer_notes_business" FOREIGN KEY ("businessId")
          REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_business_customer_notes_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_business_customer_notes_business_user"
       ON "business_customer_notes" ("businessId", "userId") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_business_customer_notes_business_user"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "business_customer_notes"`);
  }
}
