import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSenderRoleToTicketMessage1775937541622 implements MigrationInterface {
    name = 'AddSenderRoleToTicketMessage1775937541622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_messages" RENAME COLUMN "senderType" TO "senderRole"`);
        await queryRunner.query(`ALTER TYPE "public"."ticket_messages_sendertype_enum" RENAME TO "ticket_messages_senderrole_enum"`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" DROP COLUMN "senderRole"`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" ADD "senderRole" character varying(20) NOT NULL DEFAULT 'CUSTOMER'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" DROP COLUMN "senderRole"`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" ADD "senderRole" "public"."ticket_messages_senderrole_enum" NOT NULL DEFAULT 'USER'`);
        await queryRunner.query(`ALTER TYPE "public"."ticket_messages_senderrole_enum" RENAME TO "ticket_messages_sendertype_enum"`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" RENAME COLUMN "senderRole" TO "senderType"`);
    }

}
