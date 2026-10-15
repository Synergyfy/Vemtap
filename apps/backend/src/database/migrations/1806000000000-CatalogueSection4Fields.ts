import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fields the business create-product / create-service / create-deal wizards
 * already collect but had nowhere to be stored (they were silently dropped),
 * plus multi-branch deal grouping.
 *
 * Items: `compareAtPrice` ("was" price), `condition`, `fulfillmentModes`,
 * `pricingMode` (uniform vs per-branch) and a service `audience`. `variants`
 * stays jsonb; only its shape changes, handled in code.
 *
 * Offers: a deal published to several branches is one row per branch sharing
 * `dealGroupId`, so every branch-scoped query, claim and redemption keeps
 * working unchanged. The rest are the deal-rules wizard step: claim-limit
 * period, gifting switches, redemption channels and time windows, claim steps
 * and quantity tiers. `combo` and `tiered` join the pricing types.
 *
 * Claims: `redeemedAt`, so redemptions can be charted by day.
 *
 * Existing rows keep today's behaviour: `dealGroupId` null (treated as a
 * one-branch group), `allowGifting` true, lifetime claim limit,
 * `autoPauseWhenSoldOut` true (the existing claim-limit error already blocked
 * claims past `quantity`; pausing only hides a sold-out deal).
 */
export class CatalogueSection4Fields1806000000000 implements MigrationInterface {
  name = 'CatalogueSection4Fields1806000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
        ADD COLUMN "compareAtPrice" numeric(12,2),
        ADD COLUMN "condition" varchar(20),
        ADD COLUMN "fulfillmentModes" text[],
        ADD COLUMN "pricingMode" varchar(20) NOT NULL DEFAULT 'uniform',
        ADD COLUMN "audience" varchar(40)
    `);

    await queryRunner.query(`
      ALTER TYPE "catalogue_offers_pricingtype_enum" ADD VALUE IF NOT EXISTS 'combo'
    `);
    await queryRunner.query(`
      ALTER TYPE "catalogue_offers_pricingtype_enum" ADD VALUE IF NOT EXISTS 'tiered'
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_offers"
        ADD COLUMN "dealGroupId" uuid,
        ADD COLUMN "autoPauseWhenSoldOut" boolean NOT NULL DEFAULT true,
        ADD COLUMN "claimLimitPeriod" varchar(20) NOT NULL DEFAULT 'lifetime',
        ADD COLUMN "allowGifting" boolean NOT NULL DEFAULT true,
        ADD COLUMN "requireGiftRecipientVerification" boolean NOT NULL DEFAULT false,
        ADD COLUMN "socialSharingBonus" boolean NOT NULL DEFAULT false,
        ADD COLUMN "redemptionChannels" text[],
        ADD COLUMN "claimSteps" jsonb,
        ADD COLUMN "redemptionWindows" jsonb,
        ADD COLUMN "tiers" jsonb
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_catalogue_offers_dealGroupId"
      ON "catalogue_offers" ("dealGroupId")
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_offer_claims" ADD COLUMN "redeemedAt" timestamp
    `);
    // Best available history for claims redeemed before this column existed.
    await queryRunner.query(`
      UPDATE "catalogue_offer_claims"
      SET "redeemedAt" = "updatedAt"
      WHERE "status" = 'redeemed' AND "redeemedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalogue_offer_claims" DROP COLUMN "redeemedAt"
    `);
    await queryRunner.query(`DROP INDEX "IDX_catalogue_offers_dealGroupId"`);
    await queryRunner.query(`
      ALTER TABLE "catalogue_offers"
        DROP COLUMN "tiers",
        DROP COLUMN "redemptionWindows",
        DROP COLUMN "claimSteps",
        DROP COLUMN "redemptionChannels",
        DROP COLUMN "socialSharingBonus",
        DROP COLUMN "requireGiftRecipientVerification",
        DROP COLUMN "allowGifting",
        DROP COLUMN "claimLimitPeriod",
        DROP COLUMN "autoPauseWhenSoldOut",
        DROP COLUMN "dealGroupId"
    `);
    // Postgres cannot drop enum values. Move any combo/tiered offers back to a
    // type the previous code understands; 'combo'/'tiered' stay in the enum,
    // unused, which the previous code tolerates.
    await queryRunner.query(`
      UPDATE "catalogue_offers"
      SET "pricingType" = 'percentage_discount'
      WHERE "pricingType"::text IN ('combo', 'tiered')
    `);
    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
        DROP COLUMN "audience",
        DROP COLUMN "pricingMode",
        DROP COLUMN "fulfillmentModes",
        DROP COLUMN "condition",
        DROP COLUMN "compareAtPrice"
    `);
  }
}
