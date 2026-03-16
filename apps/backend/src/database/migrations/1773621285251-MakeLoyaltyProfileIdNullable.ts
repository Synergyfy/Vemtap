import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeLoyaltyProfileIdNullable1773621285251 implements MigrationInterface {
    name = 'MakeLoyaltyProfileIdNullable1773621285251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ddb9c853d8602bea573b46334b1"`);
        await queryRunner.query(`ALTER TABLE "redemptions" ALTER COLUMN "loyaltyProfileId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ddb9c853d8602bea573b46334b1"`);
        await queryRunner.query(`ALTER TABLE "redemptions" ALTER COLUMN "loyaltyProfileId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
    }

}
