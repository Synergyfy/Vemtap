import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBarcodeToCatalogueItems20260622121022 implements MigrationInterface {
  name = 'AddBarcodeToCatalogueItems20260622121022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD COLUMN IF NOT EXISTS "barcode" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_items_barcode" ON "catalogue_items" ("barcode")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_catalogue_items_barcode"`);
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "barcode"`,
    );
  }
}
