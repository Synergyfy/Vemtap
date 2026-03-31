import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderAndDeviceToVisit1774712875716 implements MigrationInterface {
    name = 'AddOrderAndDeviceToVisit1774712875716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_orders" ADD "deviceId" uuid`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "orderId" uuid`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "UQ_e2c9e8929d5e8873eb276c01553" UNIQUE ("orderId")`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_99b9d884ec57093c7ea50b17b0b" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_e2c9e8929d5e8873eb276c01553" FOREIGN KEY ("orderId") REFERENCES "catalogue_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_e2c9e8929d5e8873eb276c01553"`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_99b9d884ec57093c7ea50b17b0b"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "UQ_e2c9e8929d5e8873eb276c01553"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "orderId"`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" DROP COLUMN "deviceId"`);
    }

}
