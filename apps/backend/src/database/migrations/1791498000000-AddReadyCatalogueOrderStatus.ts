import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Orders move through a distinct "ready" stage between processing and
 * completed. The UI already had the stage; the enum did not.
 */
export class AddReadyCatalogueOrderStatus1791498000000
  implements MigrationInterface
{
  name = 'AddReadyCatalogueOrderStatus1791498000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."catalogue_orders_status_enum" ADD VALUE IF NOT EXISTS 'ready'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot remove a single enum value; leaving it is harmless.
  }
}
