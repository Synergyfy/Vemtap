import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCatalogueItemSkuAndStockDeduction1774703217352 implements MigrationInterface {
  name = 'UpdateCatalogueItemSkuAndStockDeduction1774703217352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );

    // Populate missing SKUs with unique values
    const items = await queryRunner.query(
      `SELECT id FROM "catalogue_items" WHERE sku IS NULL`,
    );
    for (const item of items) {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const sku = `SKU-${randomPart}`;
      await queryRunner.query(
        `UPDATE "catalogue_items" SET sku = $1 WHERE id = $2`,
        [sku, item.id],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD CONSTRAINT "UQ_110585a1ddfeb9f5cd0360263dc" UNIQUE ("sku")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP CONSTRAINT "UQ_110585a1ddfeb9f5cd0360263dc"`,
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
  }
}
