import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatorIdToForms1774119245743 implements MigrationInterface {
    name = 'AddCreatorIdToForms1774119245743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" ADD "creatorId" uuid`);
        
        // Backfill creatorId for existing forms using the business owner's ID
        await queryRunner.query(`
            UPDATE "forms" f
            SET "creatorId" = b."ownerId"
            FROM "businesses" b
            WHERE f."businessId" = b."id"
        `);

        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "FK_e8a117f70ad266bf2cd3f86c151" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" DROP CONSTRAINT "FK_e8a117f70ad266bf2cd3f86c151"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "creatorId"`);
    }

}
