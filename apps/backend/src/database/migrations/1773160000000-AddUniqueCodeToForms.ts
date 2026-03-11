import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueCodeToForms1773160000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create function to generate random 9-character alphanumeric code
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION generate_9_digit_code() RETURNS TEXT AS $$
      DECLARE
        chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        result TEXT := '';
        i INTEGER;
      BEGIN
        FOR i IN 1..9 LOOP
          result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add uniqueCode column with the function as default
    // This will also populate existing rows with unique values (for each row)
    await queryRunner.query(`ALTER TABLE "forms" ADD "uniqueCode" character varying DEFAULT generate_9_digit_code()`);

    // Add UNIQUE constraint and NOT NULL
    await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "uniqueCode" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "UQ_forms_uniqueCode" UNIQUE ("uniqueCode")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "forms" DROP CONSTRAINT "UQ_forms_uniqueCode"`);
    await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "uniqueCode"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS generate_9_digit_code()`);
  }
}
