import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFosIntegrationTables1786096533198 implements MigrationInterface {
  name = 'AddFosIntegrationTables1786096533198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fos_transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "date" date NOT NULL, "type" character varying NOT NULL DEFAULT 'Transfer', "category" character varying, "description" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "reference" character varying, CONSTRAINT "PK_5cbbd49a59cd6f0d668936a9329" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b3fcf554ab755babc0372a784" ON "fos_transfers" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff0234a9d2ac8498dd53b8dd9d" ON "fos_transfers" ("reference") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_settings_categories_type_enum" AS ENUM('Income', 'Expense')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_settings_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."fos_settings_categories_type_enum" NOT NULL, "description" character varying, CONSTRAINT "PK_e13cc81d2c5c613f9ca232344b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c014512b6643ace26e4fcddb54" ON "fos_settings_categories" ("name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_accounts_normalbalance_enum" AS ENUM('Debit', 'Credit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "code" character varying NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "normalBalance" "public"."fos_accounts_normalbalance_enum" NOT NULL, CONSTRAINT "UQ_557a2cd446686267d01ed86daed" UNIQUE ("code"), CONSTRAINT "PK_75e9a8cf0b9ba875d1e49101177" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_periods_status_enum" AS ENUM('Open', 'Closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."fos_periods_status_enum" NOT NULL DEFAULT 'Open', CONSTRAINT "PK_4c65aba671dfbd4f56a28caf0f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_currencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "code" character varying NOT NULL, "name" character varying NOT NULL, "symbol" character varying NOT NULL, "rate" numeric(15,2) NOT NULL DEFAULT '1', "isDefault" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_4575f42ea5650fa3032ca9da684" UNIQUE ("code"), CONSTRAINT "PK_e9b89a2c3f0d3ed9ea5e4630ffe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "role" character varying NOT NULL, "permissions" jsonb NOT NULL, CONSTRAINT "UQ_8360e5a35faa29b090be7af8d7f" UNIQUE ("role"), CONSTRAINT "PK_d87243e5605bc8f45f3baa8ee20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8360e5a35faa29b090be7af8d7" ON "fos_permissions" ("role") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_approval_rules_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_approval_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "trigger" character varying NOT NULL, "approver" character varying NOT NULL, "threshold" character varying NOT NULL, "status" "public"."fos_approval_rules_status_enum" NOT NULL DEFAULT 'Active', CONSTRAINT "PK_f2a34b3699c8b4967a16b09faee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_notification_rules_channel_enum" AS ENUM('Email', 'In-App')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_notification_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "event" character varying NOT NULL, "channel" "public"."fos_notification_rules_channel_enum" NOT NULL, "enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_eac0e15939122d13a88543552c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "timestamp" TIMESTAMP NOT NULL, "user" character varying NOT NULL, "action" character varying NOT NULL, "details" character varying, CONSTRAINT "PK_388b3f46a1b8602b7a4df5b82f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f71286d911bc28fda13988d97" ON "fos_audit_logs" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_records_type_enum" AS ENUM('Income', 'Expense')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "date" date NOT NULL, "type" "public"."fos_records_type_enum" NOT NULL, "category" character varying NOT NULL, "description" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_619138a61a790a845942fe2d96c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67b398388f9ac6c5d060b27cda" ON "fos_records" ("date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_budget_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "category" character varying NOT NULL, "item" character varying NOT NULL, "planned" numeric(15,2) NOT NULL DEFAULT '0', "actual" numeric(15,2) NOT NULL DEFAULT '0', "notes" character varying, CONSTRAINT "PK_6320c5a563e53c450e41068c45f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_182f9d64432157eb1148783a51" ON "fos_budget_items" ("category") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_budget_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, CONSTRAINT "UQ_cad69dcccdf812403cb3f516ad3" UNIQUE ("name"), CONSTRAINT "PK_71d71629bb6a67e45639a2bee32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cad69dcccdf812403cb3f516ad" ON "fos_budget_categories" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_forecast_aspects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "label" character varying NOT NULL, "baseValue" numeric(15,2) NOT NULL DEFAULT '0', "growthRate" numeric(5,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_e454066d08eeb1262a14aad9797" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_invoices_status_enum" AS ENUM('OVERDUE', 'PENDING', 'PAID')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_invoices_source_enum" AS ENUM('manual', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "customer" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "dueDate" date NOT NULL, "status" "public"."fos_invoices_status_enum" NOT NULL DEFAULT 'PENDING', "source" "public"."fos_invoices_source_enum" NOT NULL DEFAULT 'manual', "collectedAt" date, CONSTRAINT "PK_b9cc02204d5c06c7404ded76ebb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fa0beb7d4d25abc3881064f9d" ON "fos_invoices" ("customer") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_974a1d9a3dd3010829e7487c98" ON "fos_invoices" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_bills_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_bills_source_enum" AS ENUM('manual', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_bills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "description" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "dueDate" date NOT NULL, "status" "public"."fos_bills_status_enum" NOT NULL DEFAULT 'PENDING', "category" character varying, "source" "public"."fos_bills_source_enum" NOT NULL DEFAULT 'manual', "paidAt" date, CONSTRAINT "PK_b5d271704adc5141ab22bacab08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef058c6fcc6de8b2cd6398d3fd" ON "fos_bills" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_agent_commissions_status_enum" AS ENUM('pending', 'approved', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_agent_commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "agentId" character varying NOT NULL, "status" "public"."fos_agent_commissions_status_enum" NOT NULL DEFAULT 'pending', "commissionEarned" numeric(15,2) NOT NULL DEFAULT '0', "revenueAttributed" numeric(15,2) NOT NULL DEFAULT '0', "period" character varying, CONSTRAINT "UQ_47b700e7030237619a6ffe6da9d" UNIQUE ("agentId", "period"), CONSTRAINT "PK_a16cf7449c302f3de3d286ed1be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_66415bfee4375a2f2a30da3475" ON "fos_agent_commissions" ("agentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65f0aadf5a879ac32cf2836d69" ON "fos_agent_commissions" ("period") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65f0aadf5a879ac32cf2836d69"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66415bfee4375a2f2a30da3475"`,
    );
    await queryRunner.query(`DROP TABLE "fos_agent_commissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_agent_commissions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef058c6fcc6de8b2cd6398d3fd"`,
    );
    await queryRunner.query(`DROP TABLE "fos_bills"`);
    await queryRunner.query(`DROP TYPE "public"."fos_bills_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fos_bills_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_974a1d9a3dd3010829e7487c98"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4fa0beb7d4d25abc3881064f9d"`,
    );
    await queryRunner.query(`DROP TABLE "fos_invoices"`);
    await queryRunner.query(`DROP TYPE "public"."fos_invoices_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fos_invoices_status_enum"`);
    await queryRunner.query(`DROP TABLE "fos_forecast_aspects"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cad69dcccdf812403cb3f516ad"`,
    );
    await queryRunner.query(`DROP TABLE "fos_budget_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_182f9d64432157eb1148783a51"`,
    );
    await queryRunner.query(`DROP TABLE "fos_budget_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67b398388f9ac6c5d060b27cda"`,
    );
    await queryRunner.query(`DROP TABLE "fos_records"`);
    await queryRunner.query(`DROP TYPE "public"."fos_records_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f71286d911bc28fda13988d97"`,
    );
    await queryRunner.query(`DROP TABLE "fos_audit_logs"`);
    await queryRunner.query(`DROP TABLE "fos_notification_rules"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_notification_rules_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "fos_approval_rules"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_approval_rules_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8360e5a35faa29b090be7af8d7"`,
    );
    await queryRunner.query(`DROP TABLE "fos_permissions"`);
    await queryRunner.query(`DROP TABLE "fos_currencies"`);
    await queryRunner.query(`DROP TABLE "fos_periods"`);
    await queryRunner.query(`DROP TYPE "public"."fos_periods_status_enum"`);
    await queryRunner.query(`DROP TABLE "fos_accounts"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_accounts_normalbalance_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c014512b6643ace26e4fcddb54"`,
    );
    await queryRunner.query(`DROP TABLE "fos_settings_categories"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_settings_categories_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff0234a9d2ac8498dd53b8dd9d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b3fcf554ab755babc0372a784"`,
    );
    await queryRunner.query(`DROP TABLE "fos_transfers"`);
  }
}
