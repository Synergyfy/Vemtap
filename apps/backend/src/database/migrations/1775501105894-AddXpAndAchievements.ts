import { MigrationInterface, QueryRunner } from "typeorm";

export class AddXpAndAchievements1775501105894 implements MigrationInterface {
    name = 'AddXpAndAchievements1775501105894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "xpEarned" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "achievements" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "achievements"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "xpEarned"`);
    }

}
