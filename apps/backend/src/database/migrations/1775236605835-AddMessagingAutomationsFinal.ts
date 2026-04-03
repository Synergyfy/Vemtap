import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessagingAutomationsFinal1775236605835 implements MigrationInterface {
    name = 'AddMessagingAutomationsFinal1775236605835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "faq_triggers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "branchId" uuid NOT NULL, "keywords" text array NOT NULL DEFAULT '{}', "response" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9d1d0f9e0c125a5907922a7c42e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "branchId" uuid NOT NULL, "offHoursEnabled" boolean NOT NULL DEFAULT false, "offHoursMessage" text, "offHoursSchedule" character varying NOT NULL DEFAULT 'Outside Business Hours', "customSchedule" jsonb, CONSTRAINT "UQ_e4df507d8b4c74c783e37566abf" UNIQUE ("branchId"), CONSTRAINT "REL_e4df507d8b4c74c783e37566ab" UNIQUE ("branchId"), CONSTRAINT "PK_1802e10ebbe48cf6de0047de64d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "automationsEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "maxAutomations" integer`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_targettype_enum" AS ENUM('new_visitors', 'returning_customers', 'specific_category')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ADD "targetType" "public"."automation_rules_targettype_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum" RENAME TO "automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('first_message', 'after_form_submit', 'after_x_days_inactive', 'first_tag', 'repeat_tag', 'reward_earned', 'survey_completed', 'inactive_customer', 'inbound_message', 'off_hours', 'welcome_message')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum" USING "triggerType"::"text"::"public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum" RENAME TO "automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_actiontype_enum" AS ENUM('send_sms', 'send_whatsapp', 'send_email', 'send_in_app_chat', 'push_review', 'send_in_house')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "actionType" TYPE "public"."automation_rules_actiontype_enum" USING "actionType"::"text"::"public"."automation_rules_actiontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "faq_triggers" ADD CONSTRAINT "FK_3e28dd0caf5c0ef96a632ec4a67" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD CONSTRAINT "FK_e4df507d8b4c74c783e37566abf" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP CONSTRAINT "FK_e4df507d8b4c74c783e37566abf"`);
        await queryRunner.query(`ALTER TABLE "faq_triggers" DROP CONSTRAINT "FK_3e28dd0caf5c0ef96a632ec4a67"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_actiontype_enum_old" AS ENUM('send_sms', 'send_whatsapp', 'send_email', 'push_review', 'send_in_house')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "actionType" TYPE "public"."automation_rules_actiontype_enum_old" USING "actionType"::"text"::"public"."automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_actiontype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum_old" RENAME TO "automation_rules_actiontype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum_old" AS ENUM('first_tag', 'repeat_tag', 'reward_earned', 'survey_completed', 'inbound_message', 'off_hours', 'welcome_message')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum_old" USING "triggerType"::"text"::"public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum_old" RENAME TO "automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "automation_rules" DROP COLUMN "targetType"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_targettype_enum"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "maxAutomations"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "automationsEnabled"`);
        await queryRunner.query(`DROP TABLE "chat_settings"`);
        await queryRunner.query(`DROP TABLE "faq_triggers"`);
    }

}
