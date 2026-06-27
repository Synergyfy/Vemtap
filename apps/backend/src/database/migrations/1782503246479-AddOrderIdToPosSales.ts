import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderIdToPosSales1782503246479 implements MigrationInterface {
    name = 'AddOrderIdToPosSales1782503246479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pos_sales" ADD "orderId" uuid`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`CREATE INDEX "IDX_1a98d3682a04c95fd6414cd065" ON "pos_sales" ("orderId") `);
        await queryRunner.query(`ALTER TABLE "pos_sales" ADD CONSTRAINT "FK_1a98d3682a04c95fd6414cd0659" FOREIGN KEY ("orderId") REFERENCES "catalogue_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pos_sales" DROP CONSTRAINT "FK_1a98d3682a04c95fd6414cd0659"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a98d3682a04c95fd6414cd065"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "pos_sales" DROP COLUMN "orderId"`);
    }

}
