import { MigrationInterface, QueryRunner } from "typeorm";

export class AgentAdministrationSystem1774344518027 implements MigrationInterface {
    name = 'AgentAdministrationSystem1774344518027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "impersonation_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "token" character varying NOT NULL, "actorId" uuid NOT NULL, "targetBranchId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_aa55c42e3fea4fcdb4d07e91434" UNIQUE ("token"), CONSTRAINT "PK_65d4052aaf87dfbc04b6fb003bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa55c42e3fea4fcdb4d07e9143" ON "impersonation_tokens" ("token") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_module_enum" AS ENUM('LOYALTY', 'VISITORS', 'TICKETS', 'REPORTS', 'MESSAGING', 'PAYMENTS', 'SETTINGS', 'BRANCHES', 'BUSINESSES', 'ALL')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "actorId" uuid NOT NULL, "businessId" uuid, "branchId" uuid, "module" "public"."audit_logs_module_enum" NOT NULL, "method" character varying NOT NULL, "endpoint" character varying NOT NULL, "payload" jsonb, "statusCode" integer, "ipAddress" character varying, "userAgent" character varying, "impersonationTokenId" character varying, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2dc33f7f3c22e2e7badafca1d1" ON "audit_logs" ("actorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e4fdb7733a0384dff5ffca3c9" ON "audit_logs" ("businessId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c33f2e04d8b455ce7fe76099f9" ON "audit_logs" ("branchId") `);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "impersonation_tokens" ADD CONSTRAINT "FK_b297bf8294fe7110d14577b0a26" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "impersonation_tokens" ADD CONSTRAINT "FK_a4d8a70ffaf2288be926ed24d5b" FOREIGN KEY ("targetBranchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_7e4fdb7733a0384dff5ffca3c95" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_c33f2e04d8b455ce7fe76099f91" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_c33f2e04d8b455ce7fe76099f91"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_7e4fdb7733a0384dff5ffca3c95"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12"`);
        await queryRunner.query(`ALTER TABLE "impersonation_tokens" DROP CONSTRAINT "FK_a4d8a70ffaf2288be926ed24d5b"`);
        await queryRunner.query(`ALTER TABLE "impersonation_tokens" DROP CONSTRAINT "FK_b297bf8294fe7110d14577b0a26"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c33f2e04d8b455ce7fe76099f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e4fdb7733a0384dff5ffca3c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dc33f7f3c22e2e7badafca1d1"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_module_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa55c42e3fea4fcdb4d07e9143"`);
        await queryRunner.query(`DROP TABLE "impersonation_tokens"`);
    }

}
