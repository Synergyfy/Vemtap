import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfflineSyncToPosSales1782645960000 implements MigrationInterface {
  name = 'AddOfflineSyncToPosSales1782645960000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD COLUMN IF NOT EXISTS "clientRef" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD COLUMN IF NOT EXISTS "orderedAt" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pos_sales_business_client_ref" ON "pos_sales" ("businessId", "clientRef") WHERE "clientRef" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_sales_ordered_at" ON "pos_sales" ("orderedAt")`,
    );
    // Backfill orderedAt with createdAt for existing sales
    await queryRunner.query(
      `UPDATE "pos_sales" SET "orderedAt" = "createdAt" WHERE "orderedAt" IS NULL`,
    );
    // Make orderedAt NOT NULL after backfilling
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ALTER COLUMN "orderedAt" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_pos_sales_ordered_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_pos_sales_business_client_ref"`,
    );
    await queryRunner.query(`ALTER TABLE "pos_sales" DROP COLUMN "orderedAt"`);
    await queryRunner.query(`ALTER TABLE "pos_sales" DROP COLUMN "clientRef"`);
  }
}
