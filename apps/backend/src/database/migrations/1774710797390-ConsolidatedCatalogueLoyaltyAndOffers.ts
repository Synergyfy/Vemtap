import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidatedCatalogueLoyaltyAndOffers1774710797390 implements MigrationInterface {
  name = 'ConsolidatedCatalogueLoyaltyAndOffers1774710797390';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_offers_pricingtype_enum" AS ENUM('sum', 'percentage_discount', 'fixed_discount_price')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_offers_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text NOT NULL, "mainImage" character varying, "galleryImages" text, "quantity" integer, "pricingType" "public"."catalogue_offers_pricingtype_enum" NOT NULL DEFAULT 'sum', "discountValue" numeric(12,2), "fixedPrice" numeric(12,2), "calculatedPrice" numeric(12,2) NOT NULL DEFAULT '0', "loyaltyPoints" integer, "rewardId" uuid, "businessId" uuid NOT NULL, "branchId" uuid NOT NULL, "status" "public"."catalogue_offers_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_571c1f309aa1028cc8d6ed629ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_offer_items" ("offerId" uuid NOT NULL, "itemId" uuid NOT NULL, CONSTRAINT "PK_51f94582a3b4179429111459af7" PRIMARY KEY ("offerId", "itemId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8321be5651156b2baaf8acd23" ON "catalogue_offer_items" ("offerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8aea4706498de501fcbf92cbae" ON "catalogue_offer_items" ("itemId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "loyaltyPoints" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD "offerId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD "loyaltyPointsAtOrder" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "loyaltyAwarded" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "stockDeducted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."catalogue_orders_status_enum" RENAME TO "catalogue_orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_orders_status_enum" AS ENUM('new', 'processing', 'completed', 'cancelled', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" TYPE "public"."catalogue_orders_status_enum" USING "status"::"text"::"public"."catalogue_orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" SET DEFAULT 'new'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_orders_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD CONSTRAINT "FK_b333ea516f3aff635af2cbb5090" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD CONSTRAINT "FK_36f46003d77b26719ddcbea1285" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD CONSTRAINT "FK_17f48e12f3d55b7a1b5769ae4a2" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD CONSTRAINT "FK_34e1cc30cbd66cd5072529deb9b" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_items" ADD CONSTRAINT "FK_b8321be5651156b2baaf8acd237" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_items" ADD CONSTRAINT "FK_8aea4706498de501fcbf92cbae2" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_items" DROP CONSTRAINT "FK_8aea4706498de501fcbf92cbae2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_items" DROP CONSTRAINT "FK_b8321be5651156b2baaf8acd237"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP CONSTRAINT "FK_34e1cc30cbd66cd5072529deb9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP CONSTRAINT "FK_17f48e12f3d55b7a1b5769ae4a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP CONSTRAINT "FK_36f46003d77b26719ddcbea1285"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP CONSTRAINT "FK_b333ea516f3aff635af2cbb5090"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_orders_status_enum_old" AS ENUM('new', 'processing', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" TYPE "public"."catalogue_orders_status_enum_old" USING "status"::"text"::"public"."catalogue_orders_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ALTER COLUMN "status" SET DEFAULT 'new'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."catalogue_orders_status_enum_old" RENAME TO "catalogue_orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "stockDeducted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "loyaltyAwarded"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP COLUMN "loyaltyPointsAtOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP COLUMN "offerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "loyaltyPoints"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8aea4706498de501fcbf92cbae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8321be5651156b2baaf8acd23"`,
    );
    await queryRunner.query(`DROP TABLE "catalogue_offer_items"`);
    await queryRunner.query(`DROP TABLE "catalogue_offers"`);
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_offers_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_offers_pricingtype_enum"`,
    );
  }
}
