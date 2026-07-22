import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiCredits1784732621048 implements MigrationInterface {
    name = 'AddAiCredits1784732621048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ai_credit_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" character varying NOT NULL, "used" integer NOT NULL DEFAULT '0', "periodStart" TIMESTAMP NOT NULL, "periodEnd" TIMESTAMP NOT NULL, CONSTRAINT "PK_f8c320cbe24254bdc80ad9e7916" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8e813346c6216bf3ec3212a5fb" ON "ai_credit_usage" ("businessId", "periodStart") `);
        await queryRunner.query(`ALTER TABLE "plans" ADD "aiCopilotEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "aiCredits" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "aiCredits"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "aiCopilotEnabled"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e813346c6216bf3ec3212a5fb"`);
        await queryRunner.query(`DROP TABLE "ai_credit_usage"`);
    }

}
