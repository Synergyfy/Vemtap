import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpensesAndCashFlowsTables1780600000000 implements MigrationInterface {
    name = 'AddExpensesAndCashFlowsTables1780600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."expenses_frequency_enum" AS ENUM('ONE_TIME', 'RECURRING')`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "category" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "frequency" "public"."expenses_frequency_enum" NOT NULL, "date" date NOT NULL DEFAULT CURRENT_DATE, CONSTRAINT "PK_expenses" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_date" ON "expenses" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_category" ON "expenses" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_frequency" ON "expenses" ("frequency")`);

        await queryRunner.query(`CREATE TYPE "public"."cash_flows_type_enum" AS ENUM('INFLOW', 'OUTFLOW')`);
        await queryRunner.query(`CREATE TABLE "cash_flows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "type" "public"."cash_flows_type_enum" NOT NULL, "category" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "date" date NOT NULL DEFAULT CURRENT_DATE, CONSTRAINT "PK_cash_flows" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flows_date" ON "cash_flows" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flows_type" ON "cash_flows" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flows_category" ON "cash_flows" ("category")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flows_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flows_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flows_date"`);
        await queryRunner.query(`DROP TABLE "cash_flows"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flows_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_frequency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_date"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_frequency_enum"`);
    }
}
