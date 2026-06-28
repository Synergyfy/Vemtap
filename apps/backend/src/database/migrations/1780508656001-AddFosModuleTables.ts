import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFosModuleTables1780508656001 implements MigrationInterface {
  name = 'AddFosModuleTables1780508656001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."fos_transactions_type_enum" AS ENUM('SUBSCRIPTION', 'SMS', 'COMMISSION', 'EXPENSE', 'REFUND')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fos_transactions_platform_enum" AS ENUM('VEMTAP', 'QRTHRIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "type" "public"."fos_transactions_type_enum" NOT NULL, "platform" "public"."fos_transactions_platform_enum" NOT NULL, "businessId" character varying, "agentId" character varying, "amount" numeric(15,2) NOT NULL, "cost" numeric(15,2) NOT NULL DEFAULT '0', "profit" numeric(15,2) NOT NULL DEFAULT '0', "paymentMethod" character varying, "referenceId" character varying, "date" date NOT NULL, "description" character varying, CONSTRAINT "PK_fos_transactions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_type" ON "fos_transactions" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_platform" ON "fos_transactions" ("platform")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_businessId" ON "fos_transactions" ("businessId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_agentId" ON "fos_transactions" ("agentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_referenceId" ON "fos_transactions" ("referenceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_transactions_date" ON "fos_transactions" ("date")`,
    );

    await queryRunner.query(
      `CREATE TABLE "fos_metrics_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "date" date NOT NULL, "totalRevenue" numeric(15,2) NOT NULL DEFAULT '0', "totalProfit" numeric(15,2) NOT NULL DEFAULT '0', "totalBusinesses" integer NOT NULL DEFAULT '0', "activeAgents" integer NOT NULL DEFAULT '0', "churnRate" numeric(5,2) NOT NULL DEFAULT '0', "conversionRate" numeric(5,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_fos_snapshots_date" UNIQUE ("date"), CONSTRAINT "PK_fos_metrics_snapshots" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fos_snapshots_date" ON "fos_metrics_snapshots" ("date")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."fos_financial_targets_periodtype_enum" AS ENUM('daily', 'weekly', 'monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fos_financial_targets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "periodType" "public"."fos_financial_targets_periodtype_enum" NOT NULL, "targetRevenue" numeric(15,2) NOT NULL DEFAULT '0', "targetBusinesses" integer NOT NULL DEFAULT '0', "targetSmsUsage" integer NOT NULL DEFAULT '0', "targetEmailUsage" integer NOT NULL DEFAULT '0', "profitMargin" numeric(5,2) NOT NULL DEFAULT '0', "startDate" date NOT NULL, "endDate" date NOT NULL, CONSTRAINT "PK_fos_financial_targets" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "fos_forecast_scenarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "scenarioName" character varying NOT NULL, "parameters" jsonb NOT NULL, "result" jsonb NOT NULL, CONSTRAINT "PK_fos_forecast_scenarios" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fos_forecast_scenarios"`);
    await queryRunner.query(`DROP TABLE "fos_financial_targets"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_financial_targets_periodtype_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_fos_snapshots_date"`);
    await queryRunner.query(`DROP TABLE "fos_metrics_snapshots"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fos_transactions_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fos_transactions_referenceId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fos_transactions_agentId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fos_transactions_businessId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fos_transactions_platform"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_fos_transactions_type"`);
    await queryRunner.query(`DROP TABLE "fos_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."fos_transactions_platform_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."fos_transactions_type_enum"`);
  }
}
