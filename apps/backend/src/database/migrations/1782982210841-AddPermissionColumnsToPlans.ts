import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPermissionColumnsToPlans1782982210841 implements MigrationInterface {
    name = 'AddPermissionColumnsToPlans1782982210841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pos_sales_business_client_ref"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pos_sales_ordered_at"`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "inventoryEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "inventoryLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "posEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "posTerminalLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "visitorsEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "inAppChatEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "formsEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "formsLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "businessQrEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "marketingKitEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "marketingKitLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "discoveryEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "staffRolesEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "staffRolesLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "activityLogEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "qrCodesEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "qrCodesLimit" integer`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "permissionsConfiguredAt" TIMESTAMP`);
        await queryRunner.query(`UPDATE "plans" SET "permissionsConfiguredAt" = "createdAt" WHERE "permissionsConfiguredAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`CREATE INDEX "IDX_db338d8ce17971ebdacc158412" ON "pos_sales" ("orderedAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aa1534f92262defa10b4a10531" ON "pos_sales" ("businessId", "clientRef") WHERE "clientRef" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_aa1534f92262defa10b4a10531"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db338d8ce17971ebdacc158412"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "permissionsConfiguredAt"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "qrCodesLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "qrCodesEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "activityLogEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "staffRolesLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "staffRolesEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "discoveryEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "marketingKitLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "marketingKitEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "businessQrEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "formsLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "formsEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "inAppChatEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "visitorsEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "posTerminalLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "posEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "inventoryLimit"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "inventoryEnabled"`);
        await queryRunner.query(`CREATE INDEX "IDX_pos_sales_ordered_at" ON "pos_sales" ("orderedAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pos_sales_business_client_ref" ON "pos_sales" ("businessId", "clientRef") WHERE ("clientRef" IS NOT NULL)`);
    }

}
