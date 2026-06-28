import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchUsername1778089522716 implements MigrationInterface {
  name = 'AddBranchUsername1778089522716';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "username" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "UQ_branch_username" UNIQUE ("username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" DROP CONSTRAINT "UQ_branch_username"`,
    );
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "username"`);
  }
}
