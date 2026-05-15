import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMainQrCodeFieldsToBranches1778835232694 implements MigrationInterface {
    name = 'AddMainQrCodeFieldsToBranches1778835232694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" ADD "mainQrCodeId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "mainQrShortUrl" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "mainQrShortUrl"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "mainQrCodeId"`);
    }

}
