import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRewardRedemptionCount1774284959288 implements MigrationInterface {
    name = 'AddRewardRedemptionCount1774284959288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rewards" ADD "redemptionCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`
            UPDATE "rewards" r
            SET "redemptionCount" = (
                SELECT COUNT(*)
                FROM "redemption_codes" rc
                WHERE rc."rewardId" = r.id AND rc."isUsed" = true
            )
        `);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN "redemptionCount"`);
    }

}
