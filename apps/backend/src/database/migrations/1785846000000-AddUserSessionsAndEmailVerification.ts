import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSessionsAndEmailVerification1785846000000 implements MigrationInterface {
  name = 'AddUserSessionsAndEmailVerification1785846000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "deviceName" character varying NOT NULL DEFAULT 'Web browser', "platform" character varying NOT NULL DEFAULT 'web', "userAgent" character varying, "ipAddress" character varying, "lastActiveAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_sessions_userId" ON "user_sessions" ("userId")`);
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
     EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_sessions_userId"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
  }
}
