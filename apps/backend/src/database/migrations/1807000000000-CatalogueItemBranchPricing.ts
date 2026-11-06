import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-branch price / compare-at price / stock for items whose `pricingMode`
 * is `per_branch` (the location-pricing screens). Whether a branch carries an
 * item at all stays in `catalogue_item_branches`, which cart, orders, POS and
 * public discovery already read; this table only adds overrides on top.
 */
export class CatalogueItemBranchPricing1807000000000 implements MigrationInterface {
  name = 'CatalogueItemBranchPricing1807000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalogue_item_branch_pricing" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "itemId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "price" numeric(12,2),
        "compareAtPrice" numeric(12,2),
        "stockQuantity" integer,
        CONSTRAINT "PK_catalogue_item_branch_pricing" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalogue_item_branch_pricing_item_branch" UNIQUE ("itemId", "branchId"),
        CONSTRAINT "FK_catalogue_item_branch_pricing_item" FOREIGN KEY ("itemId")
          REFERENCES "catalogue_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalogue_item_branch_pricing_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    // Public branch listings look overrides up by branch.
    await queryRunner.query(`
      CREATE INDEX "IDX_catalogue_item_branch_pricing_branch"
      ON "catalogue_item_branch_pricing" ("branchId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalogue_item_branch_pricing"`);
  }
}
