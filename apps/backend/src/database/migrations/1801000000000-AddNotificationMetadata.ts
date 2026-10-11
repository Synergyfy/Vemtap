import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationMetadata1801000000000 implements MigrationInterface {
  name = 'AddNotificationMetadata1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rows written before this column existed carry no payload, so it is
    // nullable rather than defaulted — an absent payload and an empty object
    // read the same in the app, and only one of them is honest.
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD COLUMN "metadata" jsonb
    `);

    // A shift closed without reading the till was never reconciled, so these
    // stay null. A defaulted 0 would claim a drawer balanced to the naira that
    // nobody actually counted.
    await queryRunner.query(`
      ALTER TABLE "pos_register_sessions"
      ADD COLUMN "countedCash" decimal(12,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "pos_register_sessions"
      ADD COLUMN "variance" decimal(12,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pos_register_sessions"
      DROP COLUMN "variance"
    `);
    await queryRunner.query(`
      ALTER TABLE "pos_register_sessions"
      DROP COLUMN "countedCash"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP COLUMN "metadata"
    `);
  }
}
