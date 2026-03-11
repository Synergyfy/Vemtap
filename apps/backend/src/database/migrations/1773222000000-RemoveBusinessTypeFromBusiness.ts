import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBusinessTypeFromBusiness1773222000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the column 'type' from 'businesses' table
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the column 'type' as simple-enum
    // Note: TypeORM simple-enum maps to character varying in the database
    await queryRunner.query(`ALTER TABLE "businesses" ADD "type" character varying NOT NULL DEFAULT 'RETAIL'`);
  }
}
