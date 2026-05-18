import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBundleDiscountTable1778829159602 implements MigrationInterface {
    name = 'CreateBundleDiscountTable1778829159602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "bundle_discounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying NOT NULL, "minQuantity" integer NOT NULL, "maxQuantity" integer, "discountPercent" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3b4d4d3b4174b6e34598036bb8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN IF EXISTS "addOnBundleDiscounts"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "addOnBundleDiscounts" text`);
        await queryRunner.query(`DROP TABLE "bundle_discounts"`);
    }

}
