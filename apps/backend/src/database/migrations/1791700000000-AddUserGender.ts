import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets a profile carry a gender.
 *
 * The edit-profile screen has always shown a gender choice, but there was
 * nowhere to save it: the column did not exist, so the selection died with the
 * screen. Nullable so existing rows are untouched and a profile without a
 * gender keeps rendering.
 */
export class AddUserGender1791700000000 implements MigrationInterface {
  name = 'AddUserGender1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
  }
}
