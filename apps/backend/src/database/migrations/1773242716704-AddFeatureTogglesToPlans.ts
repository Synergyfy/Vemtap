import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeatureTogglesToPlans1773242716704 implements MigrationInterface {
    name = 'AddFeatureTogglesToPlans1773242716704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ADD "messagingEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "teamMembersEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "branchesEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "analyticsEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "uniqueCode" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "uniqueCode" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "uniqueCode" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "uniqueCode" SET DEFAULT generate_9_digit_code()`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "uniqueCode" SET DEFAULT generate_9_digit_code()`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "uniqueCode" SET DEFAULT generate_9_digit_code()`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "analyticsEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "branchesEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "teamMembersEnabled"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "messagingEnabled"`);
    }

}
