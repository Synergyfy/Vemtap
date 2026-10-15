import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rule-based ("dynamic") customer segments. A segment is either static —
 * hand-picked members in `segment_users`, as before — or dynamic, whose
 * members are computed from `criteria` (deal claims, menu items, branches,
 * recency, spend). `size`/`lastComputedAt` cache the member count so lists
 * don't recompute every segment on every read.
 *
 * Existing segments become `static` and their size is backfilled from
 * `segment_users`.
 */
export class DynamicSegments1808000000000 implements MigrationInterface {
  name = 'DynamicSegments1808000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "segments"
        ADD COLUMN "type" varchar(20) NOT NULL DEFAULT 'static',
        ADD COLUMN "criteria" jsonb,
        ADD COLUMN "size" integer NOT NULL DEFAULT 0,
        ADD COLUMN "lastComputedAt" timestamp
    `);
    await queryRunner.query(`
      UPDATE "segments" s
      SET "size" = (SELECT COUNT(*) FROM "segment_users" su WHERE su."segmentId" = s."id"),
          "lastComputedAt" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "segments"
        DROP COLUMN "lastComputedAt",
        DROP COLUMN "size",
        DROP COLUMN "criteria",
        DROP COLUMN "type"
    `);
  }
}
