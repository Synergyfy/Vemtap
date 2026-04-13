import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnonymousSupportFields1775935960926 implements MigrationInterface {
    name = 'AddAnonymousSupportFields1775935960926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "guestName" character varying`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "guestEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_8679e2ff150ff0e253189ca0253"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a3909878d9b1a465409846280"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1629758662443a539b14357b76"`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`CREATE INDEX "IDX_1629758662443a539b14357b76" ON "bot_conversation_context" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a3909878d9b1a465409846280" ON "bot_conversation_context" ("user_id", "session_id") `);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_8679e2ff150ff0e253189ca0253" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_8679e2ff150ff0e253189ca0253"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a3909878d9b1a465409846280"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1629758662443a539b14357b76"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "bot_conversation_context" ADD "user_id" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_1629758662443a539b14357b76" ON "bot_conversation_context" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a3909878d9b1a465409846280" ON "bot_conversation_context" ("session_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "support_tickets" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_8679e2ff150ff0e253189ca0253" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "guestEmail"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "guestName"`);
    }

}
