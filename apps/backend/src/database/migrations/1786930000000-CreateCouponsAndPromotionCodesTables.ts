import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCouponsAndPromotionCodesTables1786930000000
  implements MigrationInterface
{
  name = 'CreateCouponsAndPromotionCodesTables1786930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create coupons table
    await queryRunner.query(
      `CREATE TABLE "coupons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "discountType" character varying NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "maxDiscountAmount" numeric(10,2),
        "minSubtotal" numeric(10,2),
        "duration" character varying NOT NULL DEFAULT 'ONCE',
        "durationInMonths" integer,
        "applicablePlanIds" text[] NOT NULL DEFAULT '{}',
        "applicableBillingPeriods" text[] NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdById" uuid,
        CONSTRAINT "PK_coupons_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_coupons_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // 2. Create promotion_codes table
    await queryRunner.query(
      `CREATE TABLE "promotion_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "couponId" uuid NOT NULL,
        "code" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "startsAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "maxRedemptions" integer,
        "timesRedeemed" integer NOT NULL DEFAULT 0,
        "maxRedemptionsPerUser" integer NOT NULL DEFAULT 1,
        "firstTimeOnly" boolean NOT NULL DEFAULT false,
        "allowedBusinessIds" text[] NOT NULL DEFAULT '{}',
        "createdById" uuid,
        CONSTRAINT "PK_promotion_codes_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "promotion_codes" ADD CONSTRAINT "FK_promotion_codes_coupon" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "promotion_codes" ADD CONSTRAINT "FK_promotion_codes_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_promotion_codes_code" ON "promotion_codes" ("code")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_promotion_codes_coupon_id" ON "promotion_codes" ("couponId")`,
    );

    // 3. Create coupon_redemptions table
    await queryRunner.query(
      `CREATE TABLE "coupon_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "couponId" uuid NOT NULL,
        "promotionCodeId" uuid NOT NULL,
        "businessId" uuid,
        "userId" uuid,
        "subscriptionId" uuid,
        "paymentReference" character varying NOT NULL,
        "planId" character varying NOT NULL,
        "billingPeriod" character varying NOT NULL,
        "originalAmount" numeric(10,2) NOT NULL,
        "discountAmount" numeric(10,2) NOT NULL,
        "taxAmount" numeric(10,2) NOT NULL,
        "finalAmount" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        CONSTRAINT "PK_coupon_redemptions_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_coupon" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_promo" FOREIGN KEY ("promotionCodeId") REFERENCES "promotion_codes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_coupon_redemptions_payment_ref" ON "coupon_redemptions" ("paymentReference")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_coupon_redemptions_promo_biz" ON "coupon_redemptions" ("promotionCodeId", "businessId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_coupon_redemptions_coupon_id" ON "coupon_redemptions" ("couponId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_coupon_redemptions_business_id" ON "coupon_redemptions" ("businessId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes & constraints
    await queryRunner.query(
      `DROP INDEX "public"."IDX_coupon_redemptions_business_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_coupon_redemptions_coupon_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_coupon_redemptions_promo_biz"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_coupon_redemptions_payment_ref"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_business"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_promo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_coupon"`,
    );
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_promotion_codes_coupon_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_promotion_codes_code"`);
    await queryRunner.query(
      `ALTER TABLE "promotion_codes" DROP CONSTRAINT "FK_promotion_codes_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotion_codes" DROP CONSTRAINT "FK_promotion_codes_coupon"`,
    );
    await queryRunner.query(`DROP TABLE "promotion_codes"`);

    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "FK_coupons_created_by"`,
    );
    await queryRunner.query(`DROP TABLE "coupons"`);
  }
}
