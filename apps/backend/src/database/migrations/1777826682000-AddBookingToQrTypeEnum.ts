import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingToQrTypeEnum1777826682000 implements MigrationInterface {
  name = 'AddBookingToQrTypeEnum1777826682000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // We use DO block to safely add the value to the enum if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM pg_type t 
              JOIN pg_enum e ON t.oid = e.enumtypid 
              WHERE t.typname = 'qr_thrive_code_mappings_type_enum' 
              AND e.enumlabel = 'booking'
          ) THEN
              ALTER TYPE "public"."qr_thrive_code_mappings_type_enum" ADD VALUE 'booking';
          END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL does not support removing values from an enum.
    // To maintain data integrity and follow safety best practices, we do nothing in down.
  }
}
