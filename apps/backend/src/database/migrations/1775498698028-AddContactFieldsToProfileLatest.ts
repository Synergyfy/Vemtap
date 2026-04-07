import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContactFieldsToProfileLatest1775498698028 implements MigrationInterface {
    name = 'AddContactFieldsToProfileLatest1775498698028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "contactEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "contactPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "contactPhone"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "contactEmail"`);
    }

}
