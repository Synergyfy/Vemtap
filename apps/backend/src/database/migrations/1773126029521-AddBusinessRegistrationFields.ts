import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessRegistrationFields1773126029521 implements MigrationInterface {
    name = 'AddBusinessRegistrationFields1773126029521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "isRegistered" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "registrationNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "registrationNumber"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "isRegistered"`);
    }

}
