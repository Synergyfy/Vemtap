import { MigrationInterface, QueryRunner } from "typeorm";

export class SettingsDefaultsUpdate1778101243273 implements MigrationInterface {
    name = 'SettingsDefaultsUpdate1778101243273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_addons" DROP CONSTRAINT "FK_business_addons_addon"`);
        await queryRunner.query(`ALTER TABLE "business_addons" DROP CONSTRAINT "FK_business_addons_business"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "business_addons" ADD CONSTRAINT "FK_18020464c2fbe4314340032e228" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_addons" ADD CONSTRAINT "FK_39d910c8943fe6a12e0c37e5c83" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_addons" DROP CONSTRAINT "FK_39d910c8943fe6a12e0c37e5c83"`);
        await queryRunner.query(`ALTER TABLE "business_addons" DROP CONSTRAINT "FK_18020464c2fbe4314340032e228"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "business_addons" ADD CONSTRAINT "FK_business_addons_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_addons" ADD CONSTRAINT "FK_business_addons_addon" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
