import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessDescriptionAndSocials1781296294692 implements MigrationInterface {
  name = 'AddBusinessDescriptionAndSocials1781296294692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "socials" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "openingHours" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "timezone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "isVisible" boolean DEFAULT true`,
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
