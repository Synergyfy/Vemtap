import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingFieldsToBusinesses1781286294692 implements MigrationInterface {
    name = 'AddOnboardingFieldsToBusinesses1781286294692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "openingHours" jsonb`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "timezone" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "isVisible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "socials" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "socials"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "isVisible"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "openingHours"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "description"`);
    }
}
