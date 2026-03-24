import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkuToProducts1774290665695 implements MigrationInterface {
  name = 'AddSkuToProducts1774290665695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add sku as nullable first
    await queryRunner.query(
      `ALTER TABLE "products" ADD "sku" character varying`,
    );

    // 2. Populate existing rows with unique SKUs
    // Using a combination of 'PROD-' and the first 8 characters of the UUID to ensure uniqueness
    await queryRunner.query(
      `UPDATE "products" SET "sku" = 'PROD-' || UPPER(SUBSTRING(id::text, 1, 8)) WHERE "sku" IS NULL`,
    );

    // 3. Now make it NOT NULL and UNIQUE
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "sku" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sku"`);
  }
}
