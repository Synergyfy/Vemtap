import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `adjusted` point transactions: staff deductions from the Rewards points
 * desk. Kept apart from `redeemed` so corrections never inflate redemption
 * stats.
 */
export class PointTransactionAdjusted1821100000000 implements MigrationInterface {
  name = 'PointTransactionAdjusted1821100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."point_transactions_type_enum" ADD VALUE IF NOT EXISTS 'adjusted'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; an unused `adjusted` value is harmless.
  }
}
