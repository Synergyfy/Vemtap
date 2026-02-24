import { MigrationInterface, QueryRunner } from "typeorm";

export class SubscriptionTrialsAndCredits1771938140503 implements MigrationInterface {
    name = 'SubscriptionTrialsAndCredits1771938140503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints first to avoid errors during column mods
        await queryRunner.query(`ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "FK_0253c100f3699f97fc2ed8b34c0"`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" DROP CONSTRAINT IF EXISTS "FK_e511eec2dd0a93192bdfdcd4de2"`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" DROP CONSTRAINT IF EXISTS "FK_80d0596c9acaf40cf1ba7175aed"`);
        await queryRunner.query(`ALTER TABLE "redemptions" DROP CONSTRAINT IF EXISTS "FK_ffd3fb3e7583a259ce2beecd15a"`);
        await queryRunner.query(`ALTER TABLE "redemptions" DROP CONSTRAINT IF EXISTS "FK_ddb9c853d8602bea573b46334b1"`);
        await queryRunner.query(`ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "FK_fef5462e98502631a6af0289495"`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" DROP CONSTRAINT IF EXISTS "FK_73106f06fac64eaded06516a3a4"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e511eec2dd0a93192bdfdcd4de"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_80d0596c9acaf40cf1ba7175ae"`);

        // PLANS: Rename and update instead of Drop/Add
        await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "freeDurationDays" TO "trialDurationDays"`);
        await queryRunner.query(`UPDATE "plans" SET "trialDurationDays" = 30 WHERE "trialDurationDays" IS NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "trialDurationDays" SET DEFAULT 30`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "trialDurationDays" SET NOT NULL`);

        // REWARDS: Safe cast for businessId
        // Assuming businessId exists. If not, catching error to Add it.
        try {
            await queryRunner.query(`ALTER TABLE "rewards" ALTER COLUMN "businessId" TYPE uuid USING "businessId"::uuid`);
            await queryRunner.query(`ALTER TABLE "rewards" ALTER COLUMN "businessId" SET NOT NULL`);
        } catch (e) {
             await queryRunner.query(`ALTER TABLE "rewards" ADD "businessId" uuid NOT NULL`);
        }

        // LOYALTY PROFILES: Safe cast for businessId
        try {
            await queryRunner.query(`ALTER TABLE "loyalty_profiles" ALTER COLUMN "businessId" TYPE uuid USING "businessId"::uuid`);
            await queryRunner.query(`ALTER TABLE "loyalty_profiles" ALTER COLUMN "businessId" SET NOT NULL`);
        } catch (e) {
             await queryRunner.query(`ALTER TABLE "loyalty_profiles" ADD "businessId" uuid NOT NULL`);
        }

        // REDEMPTIONS: Safe cast for branchId
        try {
            await queryRunner.query(`ALTER TABLE "redemptions" ALTER COLUMN "branchId" TYPE varchar USING "branchId"::varchar`);
        } catch (e) {
             await queryRunner.query(`ALTER TABLE "redemptions" ADD "branchId" character varying`);
        }

        // New Plan Columns
        await queryRunner.query(`ALTER TABLE "plans" ADD "features" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "smsCredits" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "emailCredits" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "whatsappCredits" integer NOT NULL DEFAULT '0'`);

        // Subscription Columns
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "trialEndDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "paystackAuthorizationCode" text`);

        // Subscription Enum Update
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'expired', 'trial')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" USING "status"::"text"::"public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum_old"`);

        // Settings
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);

        // Other modifications
        await queryRunner.query(`ALTER TABLE "rewards" ALTER COLUMN "rewardType" SET DEFAULT 'discount'`);
        await queryRunner.query(`ALTER TABLE "rewards" ALTER COLUMN "branchId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "loyalty_profiles" DROP COLUMN "tierLevel"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."loyalty_profiles_tierlevel_enum"`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" ADD "tierLevel" character varying NOT NULL DEFAULT 'bronze'`);

        await queryRunner.query(`ALTER TABLE "redemptions" ADD CONSTRAINT "UQ_6e08df45598501197c90afb6e52" UNIQUE ("redemptionCode")`);

        await queryRunner.query(`CREATE INDEX "IDX_e511eec2dd0a93192bdfdcd4de" ON "loyalty_profiles" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_80d0596c9acaf40cf1ba7175ae" ON "loyalty_profiles" ("branchId") `);

        // Re-add FKs
        await queryRunner.query(`ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_73106f06fac64eaded06516a3a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Basic revert logic
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "whatsappCredits"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "emailCredits"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "smsCredits"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "features"`);

        await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "trialDurationDays" TO "freeDurationDays"`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "freeDurationDays" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "freeDurationDays" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "paystackAuthorizationCode"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "trialEndDate"`);
    }
}
