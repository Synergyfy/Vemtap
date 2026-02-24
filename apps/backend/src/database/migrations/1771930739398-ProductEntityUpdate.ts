import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductEntityUpdate1771930739398 implements MigrationInterface {
  name = 'ProductEntityUpdate1771930739398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The generated migration attempted to add columns (images, videos, technicalSpecifications, etc.)
    // that already exist in the database, and proposed destructive changes to other tables.
    // Since the Product entity changes are already reflected in the database schema,
    // we skip executing any SQL to prevent errors and data loss.
    // This entry serves to record that the Product entity state is accounted for.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No changes were applied, so nothing to revert.
  }
}
