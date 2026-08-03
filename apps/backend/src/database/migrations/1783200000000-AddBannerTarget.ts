import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBannerTarget1783200000000 implements MigrationInterface {
  name = 'AddBannerTarget1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banners" ADD "targetType" character varying NOT NULL DEFAULT 'custom'`,
    );
    await queryRunner.query(`ALTER TABLE "banners" ADD "targetId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "targetId"`);
    await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "targetType"`);
  }
}
