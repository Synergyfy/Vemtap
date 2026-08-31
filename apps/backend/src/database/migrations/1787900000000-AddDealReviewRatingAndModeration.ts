import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealReviewRatingAndModeration1787900000000
  implements MigrationInterface
{
  name = 'AddDealReviewRatingAndModeration1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" ADD "rating" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "requireReviewApproval" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "averageRating" numeric(3,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "averageRating"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "requireReviewApproval"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" DROP COLUMN "rating"`,
    );
  }
}
