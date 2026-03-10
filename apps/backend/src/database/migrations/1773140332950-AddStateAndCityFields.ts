import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStateAndCityFields1773140332950 implements MigrationInterface {
    name = 'AddStateAndCityFields1773140332950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "state"`);
    }

}
