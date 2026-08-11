import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFosBudgetsGoalsSettingsColumns1786038704018 implements MigrationInterface {
  name = 'AddFosBudgetsGoalsSettingsColumns1786038704018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fos_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "target" numeric(15,2) NOT NULL DEFAULT '0', "current" numeric(15,2) NOT NULL DEFAULT '0', "deadline" date, "category" character varying, CONSTRAINT "PK_bce968e44b16430faeaa76be4cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "budget" numeric(15,2) NOT NULL DEFAULT '0', "spent" numeric(15,2) NOT NULL DEFAULT '0', "revenue" numeric(15,2) NOT NULL DEFAULT '0', "status" character varying, "deadline" date, CONSTRAINT "PK_b2db71baf594cc012870e297363" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_budgets_periodtype_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "periodType" "public"."fos_budgets_periodtype_enum" NOT NULL, "targetRevenue" numeric(15,2) NOT NULL DEFAULT '0', "targetBusinesses" integer NOT NULL DEFAULT '0', "targetSmsUsage" integer NOT NULL DEFAULT '0', "targetProfit" numeric(15,2) NOT NULL DEFAULT '0', "startDate" date NOT NULL, "endDate" date NOT NULL, "createdBy" character varying, CONSTRAINT "PK_b7f8767a515efd603b461450552" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_259ab113edb8de1b90abd0cbd7" ON "fos_budgets" ("periodType") `,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "dateFormat" character varying NOT NULL DEFAULT 'DD/MM/YYYY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "theme" character varying NOT NULL DEFAULT 'light'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "paystackSecretKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "termiiApiKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'SUPER_ADMIN', 'Owner', 'Manager', 'Staff', 'Admin', 'Customer', 'Agent')`,
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
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TYPE "public"."users_role_enum_old" AS ENUM('Admin', 'Agent', 'Customer', 'Manager', 'Owner', 'Staff')`,
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
      `ALTER TABLE "settings" DROP COLUMN "termiiApiKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "paystackSecretKey"`,
    );
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "theme"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "dateFormat"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_259ab113edb8de1b90abd0cbd7"`,
    );
    await queryRunner.query(`DROP TABLE "fos_budgets"`);
    await queryRunner.query(`DROP TYPE "public"."fos_budgets_periodtype_enum"`);
    await queryRunner.query(`DROP TABLE "fos_projects"`);
    await queryRunner.query(`DROP TABLE "fos_goals"`);
  }
}
