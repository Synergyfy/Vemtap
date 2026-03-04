import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageCampaignNullableBranch1772638310069 implements MigrationInterface {
    name = 'UpdateMessageCampaignNullableBranch1772638310069'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_campaigns" ADD "businessId" uuid`);
        await queryRunner.query(`UPDATE "message_campaigns" mc SET "businessId" = b."businessId" FROM "branches" b WHERE mc."branchId" = b."id"`);
        // For any that might still be null (if branchId was somehow null already or branch missing)
        // we can either delete them or set a default. But since branchId was NOT NULL, they should all be populated.
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "businessId" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d"`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "branchId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d"`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ALTER COLUMN "branchId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_campaigns" DROP COLUMN "businessId"`);
    }

}
