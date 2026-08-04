import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckPendingChanges1785856759487 implements MigrationInterface {
    name = 'CheckPendingChanges1785856759487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_userId"`);
        await queryRunner.query(`ALTER TABLE "pos_cash_drops" DROP CONSTRAINT "FK_pos_cash_drops_register_session"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_cbe1eb6c727a7f30bbefc062e84"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_847ae48018bbd08f4fbbac53006"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_3dbc4d2ce7b9eecc9f284b925cd"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_4fc9f6fc2db22fc301f7c1c918b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_sessions_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pos_cash_drops_session_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_business_branch_created"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`CREATE INDEX "IDX_55fa4db8406ed66bc704432842" ON "user_sessions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf74086b0d776b275a79e219b0" ON "pos_cash_drops" ("registerSessionId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_49e679d96275d92088fba543d9" ON "stock_movements" ("businessId", "branchId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "FK_4b3f172d214f88fca657f864479" FOREIGN KEY ("registerSessionId") REFERENCES "pos_register_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pos_cash_drops" DROP CONSTRAINT "FK_4b3f172d214f88fca657f864479"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49e679d96275d92088fba543d9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf74086b0d776b275a79e219b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55fa4db8406ed66bc704432842"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`CREATE INDEX "IDX_stock_movements_business_branch_created" ON "stock_movements" ("branchId", "businessId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_pos_cash_drops_session_created" ON "pos_cash_drops" ("createdAt", "registerSessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_sessions_userId" ON "user_sessions" ("userId") `);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_4fc9f6fc2db22fc301f7c1c918b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_3dbc4d2ce7b9eecc9f284b925cd" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_847ae48018bbd08f4fbbac53006" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_cbe1eb6c727a7f30bbefc062e84" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "FK_pos_cash_drops_register_session" FOREIGN KEY ("registerSessionId") REFERENCES "pos_register_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
