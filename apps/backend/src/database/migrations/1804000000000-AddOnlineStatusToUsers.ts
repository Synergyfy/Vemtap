import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnlineStatusToUsers1804000000000 implements MigrationInterface {
  name = 'AddOnlineStatusToUsers1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isOnline" boolean NOT NULL DEFAULT false,
      ADD COLUMN "lastSeen" TIMESTAMP NULL
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_isOnline" ON "users" ("isOnline")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_lastSeen" ON "users" ("lastSeen")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_isOnline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_lastSeen"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isOnline", DROP COLUMN "lastSeen"`);
  }
}