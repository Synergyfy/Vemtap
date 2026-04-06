import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleAuthFields1775413885806 implements MigrationInterface {
    name = 'AddGoogleAuthFields1775413885806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_authprovider_enum" AS ENUM('LOCAL', 'GOOGLE')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'LOCAL'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "googleId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum" RENAME TO "automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('first_message', 'after_form_submit', 'after_x_days_inactive', 'reward_earned', 'survey_completed', 'inactive_customer', 'inbound_message', 'off_hours', 'welcome_message')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum" USING (CASE WHEN "triggerType"::text = 'first_tag' THEN 'first_message'::"public"."automation_rules_triggertype_enum" WHEN "triggerType"::text = 'repeat_tag' THEN 'first_message'::"public"."automation_rules_triggertype_enum" ELSE "triggerType"::text::"public"."automation_rules_triggertype_enum" END)`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_targettype_enum" RENAME TO "automation_rules_targettype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_targettype_enum" AS ENUM('all', 'new_visitors', 'returning_customers', 'segment')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "targetType" TYPE "public"."automation_rules_targettype_enum" USING (CASE WHEN "targetType"::text = 'specific_category' THEN 'all'::"public"."automation_rules_targettype_enum" ELSE "targetType"::text::"public"."automation_rules_targettype_enum" END)`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_targettype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_targettype_enum_old" AS ENUM('new_visitors', 'returning_customers', 'specific_category')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "targetType" TYPE "public"."automation_rules_targettype_enum_old" USING "targetType"::"text"::"public"."automation_rules_targettype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_targettype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_targettype_enum_old" RENAME TO "automation_rules_targettype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum_old" AS ENUM('first_message', 'after_form_submit', 'after_x_days_inactive', 'first_tag', 'repeat_tag', 'reward_earned', 'survey_completed', 'inactive_customer', 'inbound_message', 'off_hours', 'welcome_message')`);
        await queryRunner.query(`ALTER TABLE "automation_rules" ALTER COLUMN "triggerType" TYPE "public"."automation_rules_triggertype_enum_old" USING "triggerType"::"text"::"public"."automation_rules_triggertype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum_old" RENAME TO "automation_rules_triggertype_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "authProvider"`);
        await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
    }

}
