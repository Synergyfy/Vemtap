import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLatLngToBusinessAndBranch1776000000000 implements MigrationInterface {
  name = 'AddLatLngToBusinessAndBranch1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "latitude" numeric(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "longitude" numeric(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "latitude" numeric(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "longitude" numeric(10,7) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "latitude"`);
  }
}
