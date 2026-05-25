import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequiresAuthToForms1779711317985 implements MigrationInterface {
  name = 'AddRequiresAuthToForms1779711317985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "forms" ADD "requiresAuth" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" DROP CONSTRAINT "FK_d9235337d85472fe779af8bc250"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" ALTER COLUMN "visitorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" ADD CONSTRAINT "FK_d9235337d85472fe779af8bc250" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form_responses" DROP CONSTRAINT "FK_d9235337d85472fe779af8bc250"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" ALTER COLUMN "visitorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" ADD CONSTRAINT "FK_d9235337d85472fe779af8bc250" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "requiresAuth"`);
  }
}
