import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessagingEntities1773822550968 implements MigrationInterface {
    name = 'UpdateMessagingEntities1773822550968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pushToken" character varying`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD "lastMessageContent" text`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD "branchUnreadCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD "customerUnreadCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "pushToken" character varying`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "replyToId" uuid`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "replyToId"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "pushToken"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP COLUMN "customerUnreadCount"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP COLUMN "branchUnreadCount"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP COLUMN "lastMessageContent"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pushToken"`);
    }

}
