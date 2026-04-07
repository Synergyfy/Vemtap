import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRewardQuantityInfinity1775520284039 implements MigrationInterface {
    name = 'UpdateRewardQuantityInfinity1775520284039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "support_knowledge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "question" character varying NOT NULL, "answer" text NOT NULL, "keywords" jsonb NOT NULL DEFAULT '[]', "category" character varying, "isActive" boolean NOT NULL DEFAULT true, "useCount" integer NOT NULL DEFAULT '0', "link" character varying, CONSTRAINT "PK_c298f911426c9e9316c6abf5e60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0fa77a4e25270da3732abd0009" ON "support_knowledge" ("keywords") `);
        await queryRunner.query(`CREATE TABLE "bot_interactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" character varying NOT NULL, "query" character varying NOT NULL, "response" text NOT NULL, "source" character varying NOT NULL DEFAULT 'rule', "knowledgeId" character varying, "wasHelpful" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_56c6bc3ad580eaac1571bb70183" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP TABLE "bot_interactions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0fa77a4e25270da3732abd0009"`);
        await queryRunner.query(`DROP TABLE "support_knowledge"`);
    }

}
