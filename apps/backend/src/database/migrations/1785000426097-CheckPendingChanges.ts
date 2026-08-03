import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckPendingChanges1785000426097 implements MigrationInterface {
  name = 'CheckPendingChanges1785000426097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // No-op: Catalogue offer extended fields and settings updates were already applied by migration 1784999888630
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
