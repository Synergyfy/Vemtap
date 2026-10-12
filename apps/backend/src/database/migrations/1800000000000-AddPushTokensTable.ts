import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushTokensTable1800000000000 implements MigrationInterface {
  name = 'AddPushTokensTable1800000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "token" character varying NOT NULL,
        "transport" character varying NOT NULL DEFAULT 'EXPO',
        "platform" character varying,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_push_tokens_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_push_tokens_user" ON "push_tokens" ("userId")`,
    );

    // The bell and unread count are both filtered by userId; unread adds isRead.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_unread" ON "notifications" ("userId", "isRead")`,
    );

    // Newest-first listing paginates on createdAt.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON "notifications" ("userId", "createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_unread"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_tokens"`);
  }
}
