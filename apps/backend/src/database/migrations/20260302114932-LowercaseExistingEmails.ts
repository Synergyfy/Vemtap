import { MigrationInterface, QueryRunner } from 'typeorm';

export class LowercaseExistingEmails20260302114932 implements MigrationInterface {
  name = 'LowercaseExistingEmails20260302114932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lowercase all existing emails to maintain consistency with new case-insensitive logic
    await queryRunner.query(`UPDATE "users" SET "email" = LOWER("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No revert needed for lowercasing emails as it is a normalization step
  }
}
