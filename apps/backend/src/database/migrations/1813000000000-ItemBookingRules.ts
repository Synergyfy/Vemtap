import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `catalogue_items.bookingRules`: when a bookable service can be booked
 * (weekdays, hours, buffer, notice, horizon, capacity, manual confirmation).
 * Null keeps today's behaviour: the branch's opening hours, one at a time.
 */
export class ItemBookingRules1813000000000 implements MigrationInterface {
  name = 'ItemBookingRules1813000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD COLUMN IF NOT EXISTS "bookingRules" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "bookingRules"`,
    );
  }
}
