import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationContextTimestamps1777646744255 implements MigrationInterface {
  name = 'AddConversationContextTimestamps1777646744255';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_conversation_context" 
      ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      ADD COLUMN "deletedAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_conversation_context" 
      DROP COLUMN "deletedAt",
      DROP COLUMN "updatedAt",
      DROP COLUMN "createdAt"
    `);
  }
}
