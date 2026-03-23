import { MigrationInterface, QueryRunner } from "typeorm";

export class BranchEngagementSettings1774283374497 implements MigrationInterface {
    name = 'BranchEngagementSettings1774283374497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" ADD "formAppearanceColor" character varying NOT NULL DEFAULT '#2563EB'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "welcomeTag" character varying NOT NULL DEFAULT 'Quick Link'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "welcomeTitle" character varying NOT NULL DEFAULT 'Connect with us'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "successTitle" character varying NOT NULL DEFAULT 'Visit recorded successfully!'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "successDescription" text NOT NULL DEFAULT 'Thank you for visiting our store'`);
        await queryRunner.query(`UPDATE "branches" SET "welcomeMessage" = 'Leave your details to stay in touch and earn rewards.' WHERE "welcomeMessage" IS NULL`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "welcomeMessage" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "welcomeMessage" SET DEFAULT 'Leave your details to stay in touch and earn rewards.'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "welcomeMessage" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "welcomeMessage" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "successDescription"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "successTitle"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "welcomeTitle"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "welcomeTag"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "formAppearanceColor"`);
    }

}
