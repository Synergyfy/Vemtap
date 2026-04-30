import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogueAndOrders1774700353641 implements MigrationInterface {
  name = 'AddCatalogueAndOrders1774700353641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "catalogue_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "businessId" uuid NOT NULL, CONSTRAINT "PK_68df28bbd01b9007e829ef84a74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_items_status_enum" AS ENUM('active', 'inactive', 'out_of_stock', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "shortDescription" text NOT NULL, "description" text NOT NULL, "mainImage" character varying NOT NULL, "galleryImages" jsonb, "businessId" uuid NOT NULL, "categoryId" uuid, "status" "public"."catalogue_items_status_enum" NOT NULL DEFAULT 'active', "sku" character varying, "stockQuantity" integer, "allowBackOrder" boolean NOT NULL DEFAULT true, "isSuspended" boolean NOT NULL DEFAULT false, "suspensionNote" text, CONSTRAINT "PK_dfdfa87af17a78ccfe793a5a0b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "orderId" uuid NOT NULL, "itemId" uuid, "quantity" integer NOT NULL, "priceAtOrder" numeric(12,2) NOT NULL, CONSTRAINT "PK_4e35a679381a404630a207f68a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_orders_status_enum" AS ENUM('new', 'processing', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid NOT NULL, "customerId" uuid NOT NULL, "status" "public"."catalogue_orders_status_enum" NOT NULL DEFAULT 'new', "notes" text, "tableNumber" character varying, "totalAmount" numeric(12,2) NOT NULL, CONSTRAINT "PK_9a8ae38dc54b2c1fe93c477daa8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "catalogue_item_branches" ("itemId" uuid NOT NULL, "branchId" uuid NOT NULL, CONSTRAINT "PK_ab2adf578df024eb1697c90bef3" PRIMARY KEY ("itemId", "branchId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0fa3603e3ad118675d619d2925" ON "catalogue_item_branches" ("itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a70b6e5524699c15a201cf3efa" ON "catalogue_item_branches" ("branchId") `,
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
      `ALTER TABLE "catalogue_categories" ADD CONSTRAINT "FK_577d9515b7f33763c7eb3b46a46" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD CONSTRAINT "FK_93450ad69256bd876e77c085e9d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD CONSTRAINT "FK_0e900fa6208502f3e2aada99db9" FOREIGN KEY ("categoryId") REFERENCES "catalogue_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD CONSTRAINT "FK_92f86cfd064c0e189a2049fafd1" FOREIGN KEY ("orderId") REFERENCES "catalogue_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD CONSTRAINT "FK_baaf00741494556599bf81f211d" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_d3ff2e2a469fc4660a563db2735" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_431aa243d65304d89e638bcafcb" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_9abd33c02baf3d9baf7e16bf76a" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_item_branches" ADD CONSTRAINT "FK_0fa3603e3ad118675d619d29250" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_item_branches" ADD CONSTRAINT "FK_a70b6e5524699c15a201cf3efa2" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_item_branches" DROP CONSTRAINT "FK_a70b6e5524699c15a201cf3efa2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_item_branches" DROP CONSTRAINT "FK_0fa3603e3ad118675d619d29250"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_9abd33c02baf3d9baf7e16bf76a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_431aa243d65304d89e638bcafcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_d3ff2e2a469fc4660a563db2735"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP CONSTRAINT "FK_baaf00741494556599bf81f211d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP CONSTRAINT "FK_92f86cfd064c0e189a2049fafd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP CONSTRAINT "FK_0e900fa6208502f3e2aada99db9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP CONSTRAINT "FK_93450ad69256bd876e77c085e9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_categories" DROP CONSTRAINT "FK_577d9515b7f33763c7eb3b46a46"`,
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
      `DROP INDEX "public"."IDX_a70b6e5524699c15a201cf3efa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0fa3603e3ad118675d619d2925"`,
    );
    await queryRunner.query(`DROP TABLE "catalogue_item_branches"`);
    await queryRunner.query(`DROP TABLE "catalogue_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."catalogue_orders_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "catalogue_order_items"`);
    await queryRunner.query(`DROP TABLE "catalogue_items"`);
    await queryRunner.query(`DROP TYPE "public"."catalogue_items_status_enum"`);
    await queryRunner.query(`DROP TABLE "catalogue_categories"`);
  }
}
