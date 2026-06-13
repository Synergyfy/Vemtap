import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessDescriptionAndSocials1781296294692 implements MigrationInterface {
  name = 'AddBusinessDescriptionAndSocials1781296294692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "socials" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "openingHours" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "timezone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "isVisible" boolean DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "isVisible"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "openingHours"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "socials"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "description"`,
    );
  }
}
