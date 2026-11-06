import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Store ordering (scan, pick, pay at the counter) on top of catalogue orders:
 * the order's source and QR, its store stage and history, the counter
 * payment, per-line availability/substitution, the store QR codes and the
 * per-business settings document.
 */
export class StoreOrdering1820300000000 implements MigrationInterface {
  name = 'StoreOrdering1820300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalogue_orders"
        ADD COLUMN IF NOT EXISTS "source" character varying(30),
        ADD COLUMN IF NOT EXISTS "storeQrId" uuid,
        ADD COLUMN IF NOT EXISTS "storeStatus" character varying(30),
        ADD COLUMN IF NOT EXISTS "storeHistory" jsonb,
        ADD COLUMN IF NOT EXISTS "paymentStatus" character varying(20) NOT NULL DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS "payment" jsonb`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_orders_store" ON "catalogue_orders" ("businessId", "createdAt") WHERE "source" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_orders_store_qr" ON "catalogue_orders" ("storeQrId") WHERE "storeQrId" IS NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "catalogue_order_items"
        ADD COLUMN IF NOT EXISTS "available" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "removed" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "substitution" jsonb`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "store_qr_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "businessId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "code" character varying(20) NOT NULL,
        "name" character varying(120) NOT NULL,
        "type" character varying(20) NOT NULL,
        "targetLabel" character varying(160),
        "targetId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "scansCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_store_qr_codes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_store_qr_codes_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_store_qr_codes_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_qr_codes_code" ON "store_qr_codes" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_store_qr_codes_business" ON "store_qr_codes" ("businessId")`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "store_ordering_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "businessId" uuid NOT NULL,
        "settings" jsonb NOT NULL,
        CONSTRAINT "PK_store_ordering_settings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_store_ordering_settings_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_ordering_settings_business" ON "store_ordering_settings" ("businessId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "store_ordering_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_qr_codes"`);
    await queryRunner.query(`
      ALTER TABLE "catalogue_order_items"
        DROP COLUMN IF EXISTS "substitution",
        DROP COLUMN IF EXISTS "removed",
        DROP COLUMN IF EXISTS "available"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_catalogue_orders_store_qr"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_catalogue_orders_store"`,
    );
    await queryRunner.query(`
      ALTER TABLE "catalogue_orders"
        DROP COLUMN IF EXISTS "payment",
        DROP COLUMN IF EXISTS "paymentStatus",
        DROP COLUMN IF EXISTS "storeHistory",
        DROP COLUMN IF EXISTS "storeStatus",
        DROP COLUMN IF EXISTS "storeQrId",
        DROP COLUMN IF EXISTS "source"`);
  }
}
