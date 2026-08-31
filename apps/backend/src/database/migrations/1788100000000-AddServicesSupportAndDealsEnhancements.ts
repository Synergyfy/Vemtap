import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicesSupportAndDealsEnhancements1788100000000
  implements MigrationInterface
{
  name = 'AddServicesSupportAndDealsEnhancements1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums for Services if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."catalogue_items_pricetype_enum" AS ENUM('fixed', 'starting_from', 'range', 'contact');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."catalogue_items_servicemode_enum" AS ENUM('location', 'customer', 'online', 'flexible');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."catalogue_items_bookingmethod_enum" AS ENUM('vemtap', 'call', 'whatsapp', 'external');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Add Service columns to catalogue_items
    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "priceType" "public"."catalogue_items_pricetype_enum" NOT NULL DEFAULT 'fixed'
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "priceRangeMin" numeric(12,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "priceRangeMax" numeric(12,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "duration" character varying(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "serviceMode" "public"."catalogue_items_servicemode_enum" NOT NULL DEFAULT 'location'
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "isBookable" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "bookingMethod" "public"."catalogue_items_bookingmethod_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items"
      ADD COLUMN IF NOT EXISTS "externalBookingLink" character varying(500)
    `);

    // 3. Update catalogue_offers pricing enum to support fixed_discount_amount
    await queryRunner.query(`
      ALTER TYPE "public"."catalogue_offers_pricingtype_enum" ADD VALUE IF NOT EXISTS 'fixed_discount_amount'
    `);

    // 4. Set description default to empty string on catalogue_offers
    await queryRunner.query(`
      ALTER TABLE "catalogue_offers" ALTER COLUMN "description" SET DEFAULT ''
    `);

    // 5. Add sourceProductId to catalogue_offers
    await queryRunner.query(`
      ALTER TABLE "catalogue_offers"
      ADD COLUMN IF NOT EXISTS "sourceProductId" uuid
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "catalogue_offers"
        ADD CONSTRAINT "FK_catalogue_offers_source_product"
        FOREIGN KEY ("sourceProductId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalogue_offers" DROP CONSTRAINT IF EXISTS "FK_catalogue_offers_source_product"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_offers" DROP COLUMN IF EXISTS "sourceProductId"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "externalBookingLink"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "bookingMethod"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "isBookable"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "serviceMode"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "duration"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "priceRangeMax"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "priceRangeMin"
    `);

    await queryRunner.query(`
      ALTER TABLE "catalogue_items" DROP COLUMN IF EXISTS "priceType"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."catalogue_items_bookingmethod_enum"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."catalogue_items_servicemode_enum"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."catalogue_items_pricetype_enum"
    `);
  }
}
