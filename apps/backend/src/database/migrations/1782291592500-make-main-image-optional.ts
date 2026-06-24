import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeMainImageOptional1782291592500 implements MigrationInterface {
    name = 'MakeMainImageOptional1782291592500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_catalogue_items_barcode"`);
        await queryRunner.query(`CREATE TABLE "stock_count_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "sessionId" uuid NOT NULL, "itemId" uuid NOT NULL, "itemName" character varying NOT NULL, "itemSku" character varying, "itemCategory" character varying, "itemBarcode" character varying, "systemQuantity" integer, "countedQuantity" integer, "variance" integer, "varianceValue" numeric(14,2), "unitCost" numeric(12,2), "notes" text, CONSTRAINT "PK_742cd8289e4c1459cfa1ad06e4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3ae65b9c5acfeed4bb95efca6" ON "stock_count_items" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b55315c142ced7b104b82fb7e4" ON "stock_count_items" ("itemId") `);
        await queryRunner.query(`CREATE TYPE "public"."stock_count_sessions_status_enum" AS ENUM('draft', 'in_progress', 'completed', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "stock_count_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid NOT NULL, "startedById" uuid, "completedById" uuid, "approvedById" uuid, "status" "public"."stock_count_sessions_status_enum" NOT NULL DEFAULT 'draft', "isBlind" boolean NOT NULL DEFAULT true, "zone" character varying, "notes" text, "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "rejectionReason" text, "totalItems" integer NOT NULL DEFAULT '0', "countedItems" integer NOT NULL DEFAULT '0', "itemsWithVariance" integer NOT NULL DEFAULT '0', "totalVarianceValue" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_9e25833ed69bec2e9b7a093cc68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_be66eff96f2bd8c9528990a16a" ON "stock_count_sessions" ("businessId") `);
        await queryRunner.query(`CREATE INDEX "IDX_72ac1a020a0bf7b95aea087004" ON "stock_count_sessions" ("branchId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a347b3daa2aa6f4c41d2cf3e6" ON "stock_count_sessions" ("status") `);
        await queryRunner.query(`ALTER TABLE "catalogue_items" ALTER COLUMN "mainImage" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "stock_count_items" ADD CONSTRAINT "FK_e3ae65b9c5acfeed4bb95efca62" FOREIGN KEY ("sessionId") REFERENCES "stock_count_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" ADD CONSTRAINT "FK_be66eff96f2bd8c9528990a16a0" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" ADD CONSTRAINT "FK_72ac1a020a0bf7b95aea0870041" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" ADD CONSTRAINT "FK_37a305b9761e756cbf621737d30" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" ADD CONSTRAINT "FK_1aca49e944676006d4fbea5ddc0" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" ADD CONSTRAINT "FK_f7e38dff731dd4f905c7e0c80db" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" DROP CONSTRAINT "FK_f7e38dff731dd4f905c7e0c80db"`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" DROP CONSTRAINT "FK_1aca49e944676006d4fbea5ddc0"`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" DROP CONSTRAINT "FK_37a305b9761e756cbf621737d30"`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" DROP CONSTRAINT "FK_72ac1a020a0bf7b95aea0870041"`);
        await queryRunner.query(`ALTER TABLE "stock_count_sessions" DROP CONSTRAINT "FK_be66eff96f2bd8c9528990a16a0"`);
        await queryRunner.query(`ALTER TABLE "stock_count_items" DROP CONSTRAINT "FK_e3ae65b9c5acfeed4bb95efca62"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "catalogue_items" ALTER COLUMN "mainImage" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a347b3daa2aa6f4c41d2cf3e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72ac1a020a0bf7b95aea087004"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be66eff96f2bd8c9528990a16a"`);
        await queryRunner.query(`DROP TABLE "stock_count_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."stock_count_sessions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b55315c142ced7b104b82fb7e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3ae65b9c5acfeed4bb95efca6"`);
        await queryRunner.query(`DROP TABLE "stock_count_items"`);
        await queryRunner.query(`CREATE INDEX "IDX_catalogue_items_barcode" ON "catalogue_items" ("barcode") `);
    }

}
