import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveEngagementToBranch1773745978528 implements MigrationInterface {
    name = 'MoveEngagementToBranch1773745978528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" ADD "engagement" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "engagement"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "engagement" jsonb`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "engagement"`);
    }
}
