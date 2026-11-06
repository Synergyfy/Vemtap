import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Business-facing boosts and promotion campaigns on the existing
 * `sponsored_campaigns` table (which the admin console already lists and
 * bills), instead of a parallel table.
 *
 * `kind` separates single-asset boosts from multi-asset promotions; the rest
 * is what the two wizards collect (goal/objective, assets, audience,
 * placements, schedule, budget mode) plus launch bookkeeping: funding source,
 * a pending card top-up reference, launch/pause timestamps, and the run an
 * auto-renewed campaign came from. `Draft` joins the status enum for
 * campaigns being built. Existing rows become `promotion`s.
 */
export class BoostsAndPromotions1810000000000 implements MigrationInterface {
  name = 'BoostsAndPromotions1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "sponsored_campaigns_status_enum" ADD VALUE IF NOT EXISTS 'Draft'
    `);
    await queryRunner.query(`
      ALTER TABLE "sponsored_campaigns"
        ADD COLUMN "kind" varchar(20) NOT NULL DEFAULT 'promotion',
        ADD COLUMN "objective" varchar(40),
        ADD COLUMN "goalId" varchar(40),
        ADD COLUMN "assets" jsonb,
        ADD COLUMN "audience" jsonb,
        ADD COLUMN "placements" text[],
        ADD COLUMN "schedule" jsonb,
        ADD COLUMN "budgetMode" varchar(10) NOT NULL DEFAULT 'total',
        ADD COLUMN "dailyBudget" numeric(12,2),
        ADD COLUMN "fundingSource" varchar(10) NOT NULL DEFAULT 'wallet',
        ADD COLUMN "paymentReference" varchar(120),
        ADD COLUMN "launchedAt" timestamp,
        ADD COLUMN "pausedAt" timestamp,
        ADD COLUMN "renewedFromId" uuid
    `);
    // Business hub lists filter by business + kind; the hourly job scans by status.
    await queryRunner.query(`
      CREATE INDEX "IDX_sponsored_campaigns_business_kind"
      ON "sponsored_campaigns" ("businessId", "kind", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sponsored_campaigns_status"
      ON "sponsored_campaigns" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sponsored_campaigns_status"`);
    await queryRunner.query(
      `DROP INDEX "IDX_sponsored_campaigns_business_kind"`,
    );
    // Drafts never ran; anything else keeps a status the old code knows.
    await queryRunner.query(`
      DELETE FROM "sponsored_campaigns" WHERE "status"::text = 'Draft'
    `);
    await queryRunner.query(`
      ALTER TABLE "sponsored_campaigns"
        DROP COLUMN "renewedFromId",
        DROP COLUMN "pausedAt",
        DROP COLUMN "launchedAt",
        DROP COLUMN "paymentReference",
        DROP COLUMN "fundingSource",
        DROP COLUMN "dailyBudget",
        DROP COLUMN "budgetMode",
        DROP COLUMN "schedule",
        DROP COLUMN "placements",
        DROP COLUMN "audience",
        DROP COLUMN "assets",
        DROP COLUMN "goalId",
        DROP COLUMN "objective",
        DROP COLUMN "kind"
    `);
    // 'Draft' stays in the enum: Postgres cannot drop enum values.
  }
}
