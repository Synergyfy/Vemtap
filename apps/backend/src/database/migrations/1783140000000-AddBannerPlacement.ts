import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBannerPlacement1783140000000 implements MigrationInterface {
  name = 'AddBannerPlacement1783140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banners" ADD "placement" character varying NOT NULL DEFAULT 'business'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "placement"`);
  }
}
