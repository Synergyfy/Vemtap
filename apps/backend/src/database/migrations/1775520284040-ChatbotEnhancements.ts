import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatbotEnhancements1775520284040 implements MigrationInterface {
  name = 'ChatbotEnhancements1775520284040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to support_knowledge if they don't exist
    await queryRunner.query(`ALTER TABLE "support_knowledge" ADD COLUMN IF NOT EXISTS "confidence" float DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "support_knowledge" ADD COLUMN IF NOT EXISTS "success_rate" float DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "support_knowledge" ADD COLUMN IF NOT EXISTS "match_count" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "support_knowledge" ADD COLUMN IF NOT EXISTS "is_ai_generated" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "support_knowledge" ADD COLUMN IF NOT EXISTS "buttons" jsonb`);

    // Add columns to bot_interactions if they don't exist
    await queryRunner.query(`ALTER TABLE "bot_interactions" ADD COLUMN IF NOT EXISTS "confidence" float DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "bot_interactions" ADD COLUMN IF NOT EXISTS "buttons" jsonb`);
    await queryRunner.query(`ALTER TABLE "bot_interactions" ADD COLUMN IF NOT EXISTS "conversation_path" varchar`);

    // Create bot_conversation_context table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bot_conversation_context" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "user_id" varchar NOT NULL,
        "session_id" varchar NOT NULL,
        "messages" jsonb DEFAULT '[]',
        "current_path" varchar,
        "user_responses" jsonb,
        "last_activity" timestamp,
        "is_active" boolean DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bot_conversation_context_user_session" ON "bot_conversation_context"("user_id", "session_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bot_conversation_context_last_activity" ON "bot_conversation_context"("last_activity") WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We don't drop columns in down to avoid data loss, just drop the table we created
    await queryRunner.query(`DROP TABLE IF EXISTS "bot_conversation_context"`);
  }
}
