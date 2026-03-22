import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerificationToBusinesses1774119751666 implements MigrationInterface {
    name = 'AddVerificationToBusinesses1774119751666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "verifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "verifiedAt"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "isVerified"`);
    }

}
