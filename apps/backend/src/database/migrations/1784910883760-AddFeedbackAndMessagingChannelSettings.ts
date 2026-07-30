import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedbackAndMessagingChannelSettings1784910883760 implements MigrationInterface {
  name = 'AddFeedbackAndMessagingChannelSettings1784910883760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."messaging_channel_settings_smsrouting_enum" AS ENUM('africa_optimized', 'global_fastest', 'cost_optimized')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messaging_channel_settings_emaildomainstatus_enum" AS ENUM('unverified', 'verifying', 'verified')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messaging_channel_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "smsSenderId" character varying NOT NULL DEFAULT 'VemTap', "smsRouting" "public"."messaging_channel_settings_smsrouting_enum" NOT NULL DEFAULT 'africa_optimized', "whatsappPhoneNumberId" character varying, "whatsappWabaAccountId" character varying, "whatsappSystemUserToken" character varying, "whatsappRequireDoubleOptIn" boolean NOT NULL DEFAULT true, "whatsappEnableStopAutoReply" boolean NOT NULL DEFAULT true, "emailFromName" character varying, "emailFromEmail" character varying, "emailCustomDomain" character varying, "emailDomainStatus" "public"."messaging_channel_settings_emaildomainstatus_enum" NOT NULL DEFAULT 'unverified', "emailDnsRecords" jsonb, CONSTRAINT "PK_da46cfa62f5dda2d8787e1962b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69c310fcaa8d87b61bb320ef77" ON "messaging_channel_settings" ("branchId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db473f19f57870839938e70f83" ON "messaging_channel_settings" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" character varying, "branchId" character varying, "customerName" character varying NOT NULL, "rating" integer NOT NULL DEFAULT '5', "comment" text NOT NULL, "status" character varying NOT NULL DEFAULT 'new', "sentiment" character varying NOT NULL DEFAULT 'positive', CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db473f19f57870839938e70f83"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_69c310fcaa8d87b61bb320ef77"`,
    );
    await queryRunner.query(`DROP TABLE "messaging_channel_settings"`);
    await queryRunner.query(
      `DROP TYPE "public"."messaging_channel_settings_emaildomainstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."messaging_channel_settings_smsrouting_enum"`,
    );
  }
}
