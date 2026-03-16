import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoyaltyTemplates1773620432832 implements MigrationInterface {
    name = 'AddLoyaltyTemplates1773620432832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "loyalty_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "rules" jsonb NOT NULL, "rewards" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'published', CONSTRAINT "PK_9f7f175a96caae17804039a344e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD "branchId" character varying`);
        await queryRunner.query(`ALTER TABLE "redemptions" ADD "generatedByUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "redemptions" DROP COLUMN "generatedByUserId"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP COLUMN "branchId"`);
        await queryRunner.query(`DROP TABLE "loyalty_templates"`);
    }

}
