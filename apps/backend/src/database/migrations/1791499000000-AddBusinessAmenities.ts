import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Store features / amenities displayed on the Business hub. Free-form strings
 * until a curated catalogue exists; editing comes with the profile editor.
 */
export class AddBusinessAmenities1791499000000 implements MigrationInterface {
  name = 'AddBusinessAmenities1791499000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" ADD "amenities" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "amenities"`);
  }
}
