import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockMovement1785844203547 implements MigrationInterface {
    name = 'AddStockMovement1785844203547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`);
        await queryRunner.query(`ALTER TABLE "kb_pages" DROP CONSTRAINT "FK_kb_pages_category"`);
        await queryRunner.query(`ALTER TABLE "kb_pages" DROP CONSTRAINT "FK_kb_pages_section"`);
        await queryRunner.query(`ALTER TABLE "kb_sections" DROP CONSTRAINT "FK_kb_sections_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_kb_pages_path"`);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('receive', 'adjust', 'transfer', 'sale', 'return', 'count_variance')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "itemId" uuid NOT NULL, "businessId" uuid NOT NULL, "branchId" uuid, "userId" uuid, "type" "public"."stock_movements_type_enum" NOT NULL, "quantityChange" integer NOT NULL, "previousQuantity" integer NOT NULL, "newQuantity" integer NOT NULL, "reason" text NOT NULL, "referenceId" character varying, CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        // These columns are managed by the dedicated banner migrations in some
        // environments, so do not attempt to add them twice.
        if (!(await queryRunner.hasColumn('banners', 'placement'))) {
            await queryRunner.query(`ALTER TABLE "banners" ADD "placement" character varying NOT NULL DEFAULT 'business'`);
        }
        if (!(await queryRunner.hasColumn('banners', 'targetType'))) {
            await queryRunner.query(`ALTER TABLE "banners" ADD "targetType" character varying NOT NULL DEFAULT 'custom'`);
        }
        if (!(await queryRunner.hasColumn('banners', 'targetId'))) {
            await queryRunner.query(`ALTER TABLE "banners" ADD "targetId" character varying`);
        }
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3"`);
        await queryRunner.query(`ALTER TYPE "public"."conversation_threads_channel_enum" RENAME TO "conversation_threads_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_threads_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE', 'AI')`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ALTER COLUMN "channel" TYPE "public"."conversation_threads_channel_enum" USING "channel"::"text"::"public"."conversation_threads_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_threads_channel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c"`);
        await queryRunner.query(`ALTER TYPE "public"."message_templates_channel_enum" RENAME TO "message_templates_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE', 'AI')`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "channel" TYPE "public"."message_templates_channel_enum" USING "channel"::"text"::"public"."message_templates_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."message_campaigns_channel_enum" RENAME TO "message_campaigns_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_campaigns_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE', 'AI')`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "channel" TYPE "public"."message_campaigns_channel_enum" USING "channel"::"text"::"public"."message_campaigns_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_campaigns_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."messages_channel_enum" RENAME TO "messages_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."messages_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE', 'AI')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "channel" TYPE "public"."messages_channel_enum" USING "channel"::"text"::"public"."messages_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_channel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "creditPriceAi" SET DEFAULT '50'`);
        await queryRunner.query(`ALTER TYPE "public"."message_logs_channel_enum" RENAME TO "message_logs_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_logs_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE', 'AI')`);
        await queryRunner.query(`ALTER TABLE "message_logs" ALTER COLUMN "channel" TYPE "public"."message_logs_channel_enum" USING "channel"::"text"::"public"."message_logs_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_65f98b40e1e8bb49c41eee827d" ON "kb_pages" ("path") `);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3" UNIQUE ("branchId", "customerId", "channel")`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c" UNIQUE ("branchId", "name", "channel")`);
        await queryRunner.query(`ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kb_pages" ADD CONSTRAINT "FK_c6bd7dedd1f7bb1b87c623fcf48" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kb_pages" ADD CONSTRAINT "FK_6596cbba32263187cd4afb58dab" FOREIGN KEY ("sectionId") REFERENCES "kb_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kb_sections" ADD CONSTRAINT "FK_7cae0cffc2c25693982c074966b" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_cbe1eb6c727a7f30bbefc062e84" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_847ae48018bbd08f4fbbac53006" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_3dbc4d2ce7b9eecc9f284b925cd" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_4fc9f6fc2db22fc301f7c1c918b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_4fc9f6fc2db22fc301f7c1c918b"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_3dbc4d2ce7b9eecc9f284b925cd"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_847ae48018bbd08f4fbbac53006"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_cbe1eb6c727a7f30bbefc062e84"`);
        await queryRunner.query(`ALTER TABLE "kb_sections" DROP CONSTRAINT "FK_7cae0cffc2c25693982c074966b"`);
        await queryRunner.query(`ALTER TABLE "kb_pages" DROP CONSTRAINT "FK_6596cbba32263187cd4afb58dab"`);
        await queryRunner.query(`ALTER TABLE "kb_pages" DROP CONSTRAINT "FK_c6bd7dedd1f7bb1b87c623fcf48"`);
        await queryRunner.query(`ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65f98b40e1e8bb49c41eee827d"`);
        await queryRunner.query(`CREATE TYPE "public"."message_logs_channel_enum_old" AS ENUM('EMAIL', 'IN_HOUSE', 'SMS', 'WHATSAPP')`);
        await queryRunner.query(`ALTER TABLE "message_logs" ALTER COLUMN "channel" TYPE "public"."message_logs_channel_enum_old" USING "channel"::"text"::"public"."message_logs_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_logs_channel_enum_old" RENAME TO "message_logs_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "creditPriceAi" SET DEFAULT 50.00`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`CREATE TYPE "public"."messages_channel_enum_old" AS ENUM('EMAIL', 'IN_HOUSE', 'SMS', 'WHATSAPP')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "channel" TYPE "public"."messages_channel_enum_old" USING "channel"::"text"::"public"."messages_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."messages_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."messages_channel_enum_old" RENAME TO "messages_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."message_campaigns_channel_enum_old" AS ENUM('EMAIL', 'IN_HOUSE', 'SMS', 'WHATSAPP')`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "channel" TYPE "public"."message_campaigns_channel_enum_old" USING "channel"::"text"::"public"."message_campaigns_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_campaigns_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_campaigns_channel_enum_old" RENAME TO "message_campaigns_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_channel_enum_old" AS ENUM('EMAIL', 'IN_HOUSE', 'SMS', 'WHATSAPP')`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "channel" TYPE "public"."message_templates_channel_enum_old" USING "channel"::"text"::"public"."message_templates_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_templates_channel_enum_old" RENAME TO "message_templates_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c" UNIQUE ("branchId", "channel", "name")`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_threads_channel_enum_old" AS ENUM('EMAIL', 'IN_HOUSE', 'SMS', 'WHATSAPP')`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ALTER COLUMN "channel" TYPE "public"."conversation_threads_channel_enum_old" USING "channel"::"text"::"public"."conversation_threads_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_threads_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."conversation_threads_channel_enum_old" RENAME TO "conversation_threads_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_bf6efd46540551cfe4c2e2657a3" UNIQUE ("branchId", "customerId", "channel")`);
        // Banner columns may have been created by their own migrations and are
        // intentionally preserved when this combined migration is reverted.
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_kb_pages_path" ON "kb_pages" ("path") `);
        await queryRunner.query(`ALTER TABLE "kb_sections" ADD CONSTRAINT "FK_kb_sections_category" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kb_pages" ADD CONSTRAINT "FK_kb_pages_section" FOREIGN KEY ("sectionId") REFERENCES "kb_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kb_pages" ADD CONSTRAINT "FK_kb_pages_category" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
