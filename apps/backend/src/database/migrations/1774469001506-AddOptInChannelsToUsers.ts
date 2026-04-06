import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOptInChannelsToUsers1774469001506 implements MigrationInterface {
    name = 'AddOptInChannelsToUsers1774469001506'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add optInChannels as text (simple-array)
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "optInChannels" text`
        );

        // Add optOut as boolean with default false
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "optOut" boolean DEFAULT false`
        );

        // Keep the settings defaults that were generated
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new columns if rolling back
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "optInChannels"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "optOut"`
        );

        // Revert the settings defaults
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
    }
}
