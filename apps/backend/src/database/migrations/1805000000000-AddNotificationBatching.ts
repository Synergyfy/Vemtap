import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Batch-friendly notification grouping.
 *
 * A burst of the same event (five ratings in a lunch hour) was writing five
 * identical rows, so the bell showed five copies of the same thing. These
 * columns let one row stand for a group: `batchKey` names the group,
 * `groupCount` says how many events it covers, `flushedAt` closes its
 * window, and `eventType` is the stable event discriminator the key is
 * built from.
 *
 * `eventType` has to be separate from `type` because `type` is the display
 * tone and varies per row for the same event — a rating writes `success`
 * for 4 stars but `error` for 2, so `type` could never identify a rating.
 * Existing rows are left null, and a null `eventType` means "never batch",
 * so rollout does not retroactively merge anything.
 */
export class AddNotificationBatching1805000000000 implements MigrationInterface {
  name = 'AddNotificationBatching1805000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN "eventType" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN "batchKey" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN "groupCount" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN "flushedAt" timestamp
    `);

    // The open-batch lookup is the hot path on every write: one indexed
    // probe instead of a scan of the caller's whole history. Partial, so it
    // stays small — only open batches are in it, and most rows never are.
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_open_batch"
      ON "notifications" ("batchKey")
      WHERE "batchKey" IS NOT NULL AND "flushedAt" IS NULL
    `);

    // An active batch floats to the top of the feed, so the list now reads
    // on updatedAt rather than createdAt and needs the matching index.
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_updated"
      ON "notifications" ("userId", "updatedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_notifications_user_updated"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_notifications_open_batch"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN "flushedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN "groupCount"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN "batchKey"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN "eventType"
    `);
  }
}
