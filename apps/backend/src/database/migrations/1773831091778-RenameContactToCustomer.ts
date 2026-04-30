import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameContactToCustomer1773831091778 implements MigrationInterface {
  name = 'RenameContactToCustomer1773831091778';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old constraints
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_435f12bd11014722a707a292763"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_9b9d04d4c1921cd1a10afc83d3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54"`,
    );

    // Rename columns in other tables
    await queryRunner.query(
      `ALTER TABLE "messages" RENAME COLUMN "contactId" TO "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" RENAME COLUMN "contactId" TO "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" RENAME COLUMN "contactId" TO "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_logs" RENAME COLUMN "contactId" TO "customerId"`,
    );

    // Add new columns to conversation_threads
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "businessId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "customerId" uuid`,
    );

    // Backfill customerId from contacts → users mapping
    // Adjust this UPDATE to your actual mapping logic (e.g. email, phone, externalId)
    await queryRunner.query(`
    UPDATE "conversation_threads" ct
    SET "customerId" = u.id
    FROM contacts c
    JOIN users u ON u.email = c.email
    WHERE ct."contactId" = c.id
  `);

    // Now safe to drop contactId
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "contactId"`,
    );

    // Enforce NOT NULL after backfill
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ALTER COLUMN "customerId" SET NOT NULL`,
    );

    // Other changes
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "cost" TYPE numeric(10,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );

    // New constraints
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3" UNIQUE ("branchId", "customerId", "channel")`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_182cffea6be89d674dae3c6431f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_59d1c307665c1e5319cbbea72c0" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_cd3cd1906c2198f36dc5e7fe4d4" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_2a94f0c130838804e6825075453" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_2a94f0c130838804e6825075453"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_cd3cd1906c2198f36dc5e7fe4d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_59d1c307665c1e5319cbbea72c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_182cffea6be89d674dae3c6431f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "cost" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "contactId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_logs" RENAME COLUMN "customerId" TO "contactId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" RENAME COLUMN "customerId" TO "contactId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" RENAME COLUMN "customerId" TO "contactId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" RENAME COLUMN "customerId" TO "contactId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel")`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_9b9d04d4c1921cd1a10afc83d3e" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_435f12bd11014722a707a292763" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
