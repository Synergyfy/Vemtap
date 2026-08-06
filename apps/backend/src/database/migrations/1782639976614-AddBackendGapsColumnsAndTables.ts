import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBackendGapsColumnsAndTables1782639976614 implements MigrationInterface {
  name = 'AddBackendGapsColumnsAndTables1782639976614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_legal_agreement_acceptances_agreement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_legal_agreement_acceptances_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legal_agreement_acceptances_agreement"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legal_agreement_acceptances_user"`,
    );
    await queryRunner.query(
      `CREATE TABLE "pos_refund_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "refundId" uuid NOT NULL, "saleItemId" uuid NOT NULL, "quantity" integer NOT NULL, "amount" numeric(12,2) NOT NULL, CONSTRAINT "PK_98d0e312b48f684ab63e9fe7d9c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_refunds_type_enum" AS ENUM('full', 'partial')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pos_refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "saleId" uuid NOT NULL, "businessId" uuid NOT NULL, "refundedById" uuid NOT NULL, "reason" text NOT NULL, "type" "public"."pos_refunds_type_enum" NOT NULL, "refundAmount" numeric(12,2) NOT NULL, CONSTRAINT "PK_5d155d53676918fd09b92780fb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "posSettings" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "weight" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "dimensions" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "enableLoyaltyPoints" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" ADD "loyaltyPointsValue" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" ADD "refundedQuantity" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "refundReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "refundedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD "refundedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sale_items" ADD "refundedQuantity" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "pos_sales" ADD "refundReason" text`);
    await queryRunner.query(`ALTER TABLE "pos_sales" ADD "refundedById" uuid`);
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD "refundedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."catalogue_orders_status_enum" RENAME TO "catalogue_orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogue_orders_status_enum" AS ENUM('new', 'processing', 'completed', 'cancelled', 'rejected', 'refunded', 'partial_refund')`,
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
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_cbd8a14cf7f08062aa20b1023f1" FOREIGN KEY ("refundedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refund_items" ADD CONSTRAINT "FK_8a810537bbbcbbc3ed4a2518096" FOREIGN KEY ("refundId") REFERENCES "pos_refunds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refund_items" ADD CONSTRAINT "FK_5e9e5407e777c078a82ab08ffa2" FOREIGN KEY ("saleItemId") REFERENCES "pos_sale_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" ADD CONSTRAINT "FK_01ef87980c6d1251b89d29e8ad7" FOREIGN KEY ("saleId") REFERENCES "pos_sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" ADD CONSTRAINT "FK_92aacb2984b73b45bc7fad1667b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" ADD CONSTRAINT "FK_dc0a265057fb39b824f4eadb052" FOREIGN KEY ("refundedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" ADD CONSTRAINT "FK_0c16f14d661653c30c174a8fe2f" FOREIGN KEY ("refundedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_5704bcd6119973e4debd99e2d43" FOREIGN KEY ("agreementId") REFERENCES "legal_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_6143a5c54d854dc6ae65ddb84f9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_6143a5c54d854dc6ae65ddb84f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_5704bcd6119973e4debd99e2d43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP CONSTRAINT "FK_0c16f14d661653c30c174a8fe2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" DROP CONSTRAINT "FK_dc0a265057fb39b824f4eadb052"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" DROP CONSTRAINT "FK_92aacb2984b73b45bc7fad1667b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refunds" DROP CONSTRAINT "FK_01ef87980c6d1251b89d29e8ad7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refund_items" DROP CONSTRAINT "FK_5e9e5407e777c078a82ab08ffa2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_refund_items" DROP CONSTRAINT "FK_8a810537bbbcbbc3ed4a2518096"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_cbd8a14cf7f08062aa20b1023f1"`,
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
      `CREATE TYPE "public"."catalogue_orders_status_enum_old" AS ENUM('cancelled', 'completed', 'new', 'processing', 'rejected')`,
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
    await queryRunner.query(`ALTER TABLE "pos_sales" DROP COLUMN "refundedAt"`);
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP COLUMN "refundedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sales" DROP COLUMN "refundReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_sale_items" DROP COLUMN "refundedQuantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "refundedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "refundedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_orders" DROP COLUMN "refundReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_order_items" DROP COLUMN "refundedQuantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "loyaltyPointsValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "enableLoyaltyPoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "dimensions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_items" DROP COLUMN "weight"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "posSettings"`,
    );
    await queryRunner.query(`DROP TABLE "pos_refunds"`);
    await queryRunner.query(`DROP TYPE "public"."pos_refunds_type_enum"`);
    await queryRunner.query(`DROP TABLE "pos_refund_items"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_legal_agreement_acceptances_user" ON "legal_agreement_acceptances" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legal_agreement_acceptances_agreement" ON "legal_agreement_acceptances" ("agreementId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_legal_agreement_acceptances_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_legal_agreement_acceptances_agreement" FOREIGN KEY ("agreementId") REFERENCES "legal_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
