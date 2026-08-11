import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditBackendTables1785853220568 implements MigrationInterface {
  name = 'AddAuditBackendTables1785853220568';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('feedback', 'customerId'))) {
      await queryRunner.query(
        `ALTER TABLE "feedback" ADD "customerId" character varying`,
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_cash_drops" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "registerSessionId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "droppedById" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "reason" text NOT NULL,
        CONSTRAINT "PK_pos_cash_drops" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_cash_drops_session_created" ON "pos_cash_drops" ("registerSessionId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_business_branch_created" ON "stock_movements" ("businessId", "branchId", "createdAt")`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "pos_cash_drops"
          ADD CONSTRAINT "FK_pos_cash_drops_register_session"
          FOREIGN KEY ("registerSessionId")
          REFERENCES "pos_register_sessions"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_cash_drops" DROP CONSTRAINT IF EXISTS "FK_pos_cash_drops_register_session"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_movements_business_branch_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pos_cash_drops_session_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_cash_drops"`);
    if (await queryRunner.hasColumn('feedback', 'customerId')) {
      await queryRunner.query(
        `ALTER TABLE "feedback" DROP COLUMN "customerId"`,
      );
    }
  }
}
