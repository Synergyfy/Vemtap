import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatSettingsAndCategories1773576785355 implements MigrationInterface {
    name = 'AddChatSettingsAndCategories1773576785355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."chat_categories_urgency_enum" AS ENUM('Low', 'Medium', 'High')`);
        await queryRunner.query(`CREATE TABLE "chat_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "branchId" uuid NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "routeTo" character varying, "urgency" "public"."chat_categories_urgency_enum" NOT NULL DEFAULT 'Medium', "teamAccess" jsonb NOT NULL DEFAULT '[]', "icon" character varying, CONSTRAINT "PK_1456541ff455a408a256efafc44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum" RENAME TO "automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('first_tag', 'repeat_tag', 'reward_earned', 'survey_completed', 'inbound_message', 'off_hours', 'welcome_message')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum" USING "triggerType"::"text"::"public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum" RENAME TO "automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_actiontype_enum" AS ENUM('send_sms', 'send_whatsapp', 'send_email', 'push_review', 'send_in_house')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "actionType" TYPE "public"."automation_rules_actiontype_enum" USING "actionType"::"text"::"public"."automation_rules_actiontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "chat_categories" ADD CONSTRAINT "FK_741b6bbe203f5dad5664d1a9f72" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_categories" DROP CONSTRAINT "FK_741b6bbe203f5dad5664d1a9f72"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_actiontype_enum_old" AS ENUM('send_sms', 'send_whatsapp', 'send_email', 'push_review')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "actionType" TYPE "public"."automation_rules_actiontype_enum_old" USING "actionType"::"text"::"public"."automation_rules_actiontype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_actiontype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum_old" RENAME TO "automation_rules_actiontype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum_old" AS ENUM('first_tag', 'repeat_tag', 'reward_earned', 'survey_completed')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum_old" USING "triggerType"::"text"::"public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum_old" RENAME TO "automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP TABLE "chat_categories"`);
        await queryRunner.query(`DROP TYPE "public"."chat_categories_urgency_enum"`);
    }

}
