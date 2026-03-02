import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageTemplatesAndSettings1772448441793 implements MigrationInterface {
    name = 'UpdateMessageTemplatesAndSettings1772448441793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_templates" ADD "isSystem" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "FK_287b0bb37bfab02d52698eea64b"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4"`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "businessId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4" UNIQUE ("businessId", "name", "channel")`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "FK_287b0bb37bfab02d52698eea64b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "FK_287b0bb37bfab02d52698eea64b"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "message_templates" ALTER COLUMN "businessId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4" UNIQUE ("businessId", "channel", "name")`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "FK_287b0bb37bfab02d52698eea64b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "isSystem"`);
    }

}
