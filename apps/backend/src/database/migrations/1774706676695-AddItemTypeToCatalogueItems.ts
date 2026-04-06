import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemTypeToCatalogueItems1774706676695 implements MigrationInterface {
    name = 'AddItemTypeToCatalogueItems1774706676695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."catalogue_items_itemtype_enum" AS ENUM('product', 'service')`);
        await queryRunner.query(`ALTER TABLE "catalogue_items" ADD "itemType" "public"."catalogue_items_itemtype_enum" NOT NULL DEFAULT 'product'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "catalogue_items" DROP COLUMN "itemType"`);
        await queryRunner.query(`DROP TYPE "public"."catalogue_items_itemtype_enum"`);
    }

}
