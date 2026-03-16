import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessagingUnitsAndReference1773404039966 implements MigrationInterface {
    name = 'AddMessagingUnitsAndReference1773404039966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "units" integer`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "reference" character varying`);
        await queryRunner.query(`ALTER TABLE "message_logs" ADD "cost" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "message_logs" ADD "units" integer`);
        await queryRunner.query(`ALTER TABLE "message_logs" ADD "reference" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "message_logs" DROP COLUMN "reference"`);
        await queryRunner.query(`ALTER TABLE "message_logs" DROP COLUMN "units"`);
        await queryRunner.query(`ALTER TABLE "message_logs" DROP COLUMN "cost"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "reference"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "units"`);
    }

}
