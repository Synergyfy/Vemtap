import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInHouseChannel1773575931680 implements MigrationInterface {
    name = 'AddInHouseChannel1773575931680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c"`);
        await queryRunner.query(`ALTER TYPE "public"."message_templates_channel_enum" RENAME TO "message_templates_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE')`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "channel" TYPE "public"."message_templates_channel_enum" USING "channel"::"text"::"public"."message_templates_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."message_campaigns_channel_enum" RENAME TO "message_campaigns_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_campaigns_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE')`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "channel" TYPE "public"."message_campaigns_channel_enum" USING "channel"::"text"::"public"."message_campaigns_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_campaigns_channel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54"`);
        await queryRunner.query(`ALTER TYPE "public"."conversation_threads_channel_enum" RENAME TO "conversation_threads_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_threads_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE')`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ALTER COLUMN "channel" TYPE "public"."conversation_threads_channel_enum" USING "channel"::"text"::"public"."conversation_threads_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_threads_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."messages_channel_enum" RENAME TO "messages_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."messages_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "channel" TYPE "public"."messages_channel_enum" USING "channel"::"text"::"public"."messages_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."message_logs_channel_enum" RENAME TO "message_logs_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."message_logs_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_HOUSE')`);
        await queryRunner.query(`ALTER TABLE "message_logs" ALTER COLUMN "channel" TYPE "public"."message_logs_channel_enum" USING "channel"::"text"::"public"."message_logs_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c" UNIQUE ("branchId", "name", "channel")`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c"`);
        await queryRunner.query(`CREATE TYPE "public"."message_logs_channel_enum_old" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`);
        await queryRunner.query(`ALTER TABLE "message_logs" ALTER COLUMN "channel" TYPE "public"."message_logs_channel_enum_old" USING "channel"::"text"::"public"."message_logs_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_logs_channel_enum_old" RENAME TO "message_logs_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."messages_channel_enum_old" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "channel" TYPE "public"."messages_channel_enum_old" USING "channel"::"text"::"public"."messages_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."messages_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."messages_channel_enum_old" RENAME TO "messages_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_threads_channel_enum_old" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ALTER COLUMN "channel" TYPE "public"."conversation_threads_channel_enum_old" USING "channel"::"text"::"public"."conversation_threads_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_threads_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."conversation_threads_channel_enum_old" RENAME TO "conversation_threads_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel")`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`CREATE TYPE "public"."message_campaigns_channel_enum_old" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "channel" TYPE "public"."message_campaigns_channel_enum_old" USING "channel"::"text"::"public"."message_campaigns_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_campaigns_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_campaigns_channel_enum_old" RENAME TO "message_campaigns_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_channel_enum_old" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "channel" TYPE "public"."message_templates_channel_enum_old" USING "channel"::"text"::"public"."message_templates_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_templates_channel_enum_old" RENAME TO "message_templates_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c" UNIQUE ("channel", "name", "branchId")`);
    }

}
