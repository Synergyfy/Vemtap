import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBundleDiscountsToSettings1778827349002 implements MigrationInterface {
  name = 'AddBundleDiscountsToSettings1778827349002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "addOnBundleDiscounts" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "addOnBundleDiscounts"`,
    );
  }
}
