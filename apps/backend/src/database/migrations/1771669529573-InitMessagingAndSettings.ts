import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMessagingAndSettings1771669529573 implements MigrationInterface {
  name = 'InitMessagingAndSettings1771669529573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_threads_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_threads_status_enum" AS ENUM('OPEN', 'CLOSED', 'RESOLVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation_threads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "contactId" uuid NOT NULL, "channel" "public"."conversation_threads_channel_enum" NOT NULL, "lastActivityAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."conversation_threads_status_enum" NOT NULL DEFAULT 'OPEN', "notes" jsonb, CONSTRAINT "UQ_24400d50820ef6c98461bf70b0c" UNIQUE ("businessId", "contactId", "channel"), CONSTRAINT "PK_3ce0e3590f31e205ac457655de3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "phone" character varying, "email" character varying, "name" character varying, "optInChannels" text NOT NULL DEFAULT '["SMS","WHATSAPP","EMAIL"]', "optOut" boolean NOT NULL DEFAULT false, "tags" text, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_templates_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "channel" "public"."message_templates_channel_enum" NOT NULL, "name" character varying NOT NULL, "content" text NOT NULL, CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4" UNIQUE ("businessId", "name", "channel"), CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_audiencetype_enum" AS ENUM('ALL', 'GROUP', 'TAGGED', 'RECENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_status_enum" AS ENUM('DRAFT', 'PROCESSING', 'SENT', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "name" character varying NOT NULL, "channel" "public"."message_campaigns_channel_enum" NOT NULL, "audienceType" "public"."message_campaigns_audiencetype_enum" NOT NULL, "audienceSize" integer NOT NULL DEFAULT '0', "templateId" uuid, "content" text, "estimatedCost" numeric(10,4) NOT NULL DEFAULT '0', "actualCost" numeric(10,4), "status" "public"."message_campaigns_status_enum" NOT NULL DEFAULT 'DRAFT', "sentAt" TIMESTAMP, "metrics" jsonb, CONSTRAINT "PK_183946228582c5f18c02f7b6775" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "contactId" uuid, "threadId" uuid, "campaignId" uuid, "direction" "public"."messages_direction_enum" NOT NULL, "content" text NOT NULL, "status" "public"."messages_status_enum" NOT NULL DEFAULT 'PENDING', "infobipMessageId" character varying, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_status_enum" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "contactId" character varying, "campaignId" character varying, "messageId" character varying, "channel" "public"."message_logs_channel_enum" NOT NULL, "direction" "public"."message_logs_direction_enum" NOT NULL, "status" "public"."message_logs_status_enum" NOT NULL, "errorReason" character varying, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f0aae0d876a96fa1da0a1b97444" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_182cffea6be89d674dae3c6431f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "FK_287b0bb37bfab02d52698eea64b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_3c04a8d62ced12a0a32c717ab26" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2234441aac965d27bd93edb33d6" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_435f12bd11014722a707a292763" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0" FOREIGN KEY ("threadId") REFERENCES "conversation_threads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_621cca3fc837c781bd415fdf49e" FOREIGN KEY ("campaignId") REFERENCES "message_campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" ADD CONSTRAINT "FK_6cd8838fbb238db1495c608464d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_logs" DROP CONSTRAINT "FK_6cd8838fbb238db1495c608464d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_621cca3fc837c781bd415fdf49e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_435f12bd11014722a707a292763"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2234441aac965d27bd93edb33d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_3c04a8d62ced12a0a32c717ab26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "FK_287b0bb37bfab02d52698eea64b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_182cffea6be89d674dae3c6431f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(`DROP TABLE "message_logs"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_direction_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_direction_enum"`);
    await queryRunner.query(`DROP TABLE "message_campaigns"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_audiencetype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "message_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_templates_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "conversation_threads"`);
    await queryRunner.query(
      `DROP TYPE "public"."conversation_threads_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."conversation_threads_channel_enum"`,
    );
  }
}
