import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVisitEntity1772004952457 implements MigrationInterface {
    name = 'UpdateVisitEntity1772004952457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9"`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "businessId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "branchId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "branchId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "businessId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
