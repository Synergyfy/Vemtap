import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealFeaturedAndPlanAutoFeature1788000000000
  implements MigrationInterface
{
  name = 'AddDealFeaturedAndPlanAutoFeature1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "autoFeatureDeals" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "autoFeatureDeals"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "isFeatured"`,
    );
  }
}
