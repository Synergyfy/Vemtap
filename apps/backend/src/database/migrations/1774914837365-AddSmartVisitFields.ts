import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmartVisitFields1774914837365 implements MigrationInterface {
    name = 'AddSmartVisitFields1774914837365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_orders" ADD "sessionToken" uuid`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "visitType" character varying DEFAULT 'portal'`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "sessionToken" uuid`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "UQ_32cd7d6a513c4525756a63cf9f0" UNIQUE ("sessionToken")`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "upgradedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "ipAddress" character varying(45)`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "userAgent" text`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "userAgent"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "ipAddress"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "upgradedAt"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "UQ_32cd7d6a513c4525756a63cf9f0"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "sessionToken"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "visitType"`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" DROP COLUMN "sessionToken"`);
    }

}
