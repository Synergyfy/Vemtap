import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsMainToDevices1779204554478 implements MigrationInterface {
    name = 'AddIsMainToDevices1779204554478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" ADD "isMain" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`
            UPDATE "devices"
            SET "isMain" = true
            WHERE "id" IN (
                SELECT "id" FROM (
                    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "branchId" ORDER BY "createdAt" ASC) as rn
                    FROM "devices"
                    WHERE "branchId" IS NOT NULL
                ) t
                WHERE t.rn = 1
            )
        `);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "isMain"`);
    }

}
