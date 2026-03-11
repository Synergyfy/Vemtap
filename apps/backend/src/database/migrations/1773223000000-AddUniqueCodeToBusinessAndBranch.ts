import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueCodeToBusinessAndBranch1773223000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add uniqueCode to businesses
    await queryRunner.query(`ALTER TABLE "businesses" ADD "uniqueCode" character varying DEFAULT generate_9_digit_code()`);
    await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "uniqueCode" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "UQ_businesses_uniqueCode" UNIQUE ("uniqueCode")`);

    // Add uniqueCode to branches
    await queryRunner.query(`ALTER TABLE "branches" ADD "uniqueCode" character varying DEFAULT generate_9_digit_code()`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "uniqueCode" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "UQ_branches_uniqueCode" UNIQUE ("uniqueCode")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "UQ_branches_uniqueCode"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "uniqueCode"`);

    await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "UQ_businesses_uniqueCode"`);
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "uniqueCode"`);
  }
}
