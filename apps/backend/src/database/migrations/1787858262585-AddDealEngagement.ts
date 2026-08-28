import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealEngagement1787858262585 implements MigrationInterface {
  name = 'AddDealEngagement1787858262585';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "deal_saves" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_deal_saves_offer_user" UNIQUE ("offerId", "userId"), CONSTRAINT "PK_deal_saves" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deal_saves_offer_id" ON "deal_saves" ("offerId")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."deal_reviews_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deal_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "userId" uuid, "ipHash" character varying(64), "reviewerName" character varying NOT NULL, "comment" text NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "status" "public"."deal_reviews_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_deal_reviews" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deal_reviews_offer_id" ON "deal_reviews" ("offerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deal_reviews_ip_hash" ON "deal_reviews" ("ipHash")`,
    );

    await queryRunner.query(
      `CREATE TABLE "deal_review_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "reviewId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_deal_review_likes_review_user" UNIQUE ("reviewId", "userId"), CONSTRAINT "PK_deal_review_likes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deal_review_likes_review_id" ON "deal_review_likes" ("reviewId")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."deal_reactions_type_enum" AS ENUM('like', 'dislike')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deal_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "userId" uuid NOT NULL, "type" "public"."deal_reactions_type_enum" NOT NULL, CONSTRAINT "UQ_deal_reactions_offer_user" UNIQUE ("offerId", "userId"), CONSTRAINT "PK_deal_reactions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deal_reactions_offer_id" ON "deal_reactions" ("offerId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "likesCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "dislikesCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD "reviewsCount" integer NOT NULL DEFAULT '0'`,
    );

    await queryRunner.query(
      `ALTER TABLE "deal_saves" ADD CONSTRAINT "FK_deal_saves_offer" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_saves" ADD CONSTRAINT "FK_deal_saves_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" ADD CONSTRAINT "FK_deal_reviews_offer" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" ADD CONSTRAINT "FK_deal_reviews_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_review_likes" ADD CONSTRAINT "FK_deal_review_likes_review" FOREIGN KEY ("reviewId") REFERENCES "deal_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_review_likes" ADD CONSTRAINT "FK_deal_review_likes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reactions" ADD CONSTRAINT "FK_deal_reactions_offer" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reactions" ADD CONSTRAINT "FK_deal_reactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_reactions" DROP CONSTRAINT "FK_deal_reactions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reactions" DROP CONSTRAINT "FK_deal_reactions_offer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_review_likes" DROP CONSTRAINT "FK_deal_review_likes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_review_likes" DROP CONSTRAINT "FK_deal_review_likes_review"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" DROP CONSTRAINT "FK_deal_reviews_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" DROP CONSTRAINT "FK_deal_reviews_offer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_saves" DROP CONSTRAINT "FK_deal_saves_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_saves" DROP CONSTRAINT "FK_deal_saves_offer"`,
    );

    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "reviewsCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "dislikesCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "likesCount"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_deal_reactions_offer_id"`,
    );
    await queryRunner.query(`DROP TABLE "deal_reactions"`);
    await queryRunner.query(`DROP TYPE "public"."deal_reactions_type_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_deal_review_likes_review_id"`,
    );
    await queryRunner.query(`DROP TABLE "deal_review_likes"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_deal_reviews_ip_hash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_deal_reviews_offer_id"`);
    await queryRunner.query(`DROP TABLE "deal_reviews"`);
    await queryRunner.query(`DROP TYPE "public"."deal_reviews_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_deal_saves_offer_id"`);
    await queryRunner.query(`DROP TABLE "deal_saves"`);
  }
}
