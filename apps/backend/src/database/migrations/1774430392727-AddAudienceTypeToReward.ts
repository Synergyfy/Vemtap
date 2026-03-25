import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAudienceTypeToReward1774430392727 implements MigrationInterface {
    name = 'AddAudienceTypeToReward1774430392727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rewards_audiencetype_enum" AS ENUM('new', 'returning', 'all')`);
        await queryRunner.query(`ALTER TABLE "rewards" ADD "audienceType" "public"."rewards_audiencetype_enum" NOT NULL DEFAULT 'all'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN "audienceType"`);
        await queryRunner.query(`DROP TYPE "public"."rewards_audiencetype_enum"`);
    }

}
