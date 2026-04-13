import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncBotEntitiesAndSettings1775672780608 implements MigrationInterface {
    name = 'SyncBotEntitiesAndSettings1775672780608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "confidence" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "success_rate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "match_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "is_ai_generated" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "source" SET DEFAULT 'knowledge_base'`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "confidence" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ALTER COLUMN "messages" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`CREATE INDEX "IDX_1629758662443a539b14357b76" ON "bot_conversation_context" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9e49fce9380371cf8b4f66b73" ON "bot_conversation_context" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a3909878d9b1a465409846280" ON "bot_conversation_context" ("user_id", "session_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3a3909878d9b1a465409846280"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9e49fce9380371cf8b4f66b73"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1629758662443a539b14357b76"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ALTER COLUMN "messages" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "confidence" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "source" SET DEFAULT 'rule'`);
        await queryRunner.query(`ALTER TABLE "bot_interactions" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "is_ai_generated" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "match_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "success_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_knowledge" ALTER COLUMN "confidence" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    }

}
