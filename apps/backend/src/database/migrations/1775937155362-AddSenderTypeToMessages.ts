import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSenderTypeToMessages1775937155362 implements MigrationInterface {
    name = 'AddSenderTypeToMessages1775937155362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ticket_messages_sendertype_enum" AS ENUM('USER', 'AGENT', 'BOT')`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" ADD "senderType" "public"."ticket_messages_sendertype_enum" NOT NULL DEFAULT 'USER'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" DROP COLUMN "senderType"`);
        await queryRunner.query(`DROP TYPE "public"."ticket_messages_sendertype_enum"`);
    }

}
