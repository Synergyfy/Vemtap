import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Business branding media: storefront cover banner and the gallery of
 * interior/product photos uploaded from the business setup wizard. `logoUrl`
 * already existed.
 */
export class AddBusinessCoverAndGallery1791497000000 implements MigrationInterface {
  name = 'AddBusinessCoverAndGallery1791497000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "coverImage" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" ADD "gallery" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "gallery"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "coverImage"`,
    );
  }
}
