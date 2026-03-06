import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentDashboardSupport1772794070138 implements MigrationInterface {
  name = 'AddAgentDashboardSupport1772794070138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ticket_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketId" uuid NOT NULL, "action" character varying NOT NULL, "by" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b598792cb53ce51cb4b3cb5db1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."support_tickets_priority_enum" AS ENUM('Low', 'Normal', 'High', 'Urgent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD "priority" "public"."support_tickets_priority_enum" NOT NULL DEFAULT 'Normal'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."support_tickets_type_enum" AS ENUM('Chat', 'Ticket')`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD "type" "public"."support_tickets_type_enum" NOT NULL DEFAULT 'Ticket'`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD "channel" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD "assignedToId" uuid`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('Owner', 'Manager', 'Staff', 'Admin', 'Customer', 'Agent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "category" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."support_tickets_status_enum" RENAME TO "support_tickets_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."support_tickets_status_enum" AS ENUM('Pending', 'In Progress', 'Resolved', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE "public"."support_tickets_status_enum" USING "status"::"text"::"public"."support_tickets_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'Pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."support_tickets_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8679e2ff150ff0e253189ca025" ON "support_tickets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba7b1a2ed4051fb3b39ff95444" ON "support_tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0bec69b640265cb806d96eb4c4" ON "support_tickets" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_947e77544ab7d5fd9521c44e06" ON "support_tickets" ("assignedToId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_activity" ADD CONSTRAINT "FK_7cc9884e6d4b04546686cc610b5" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_947e77544ab7d5fd9521c44e069" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_947e77544ab7d5fd9521c44e069"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_activity" DROP CONSTRAINT "FK_7cc9884e6d4b04546686cc610b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_947e77544ab7d5fd9521c44e06"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0bec69b640265cb806d96eb4c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba7b1a2ed4051fb3b39ff95444"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8679e2ff150ff0e253189ca025"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."support_tickets_status_enum_old" AS ENUM('Closed', 'In Progress', 'Open')`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE "public"."support_tickets_status_enum_old" USING "status"::"text"::"public"."support_tickets_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'Open'`,
    );
    await queryRunner.query(`DROP TYPE "public"."support_tickets_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."support_tickets_status_enum_old" RENAME TO "support_tickets_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "category" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum_old" AS ENUM('Admin', 'Customer', 'Manager', 'Owner', 'Staff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP COLUMN "assignedToId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP COLUMN "channel"`,
    );
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."support_tickets_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP COLUMN "priority"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."support_tickets_priority_enum"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_activity"`);
  }
}
