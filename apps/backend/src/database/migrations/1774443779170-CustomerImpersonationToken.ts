import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomerImpersonationToken1774443779170 implements MigrationInterface {
    name = 'CustomerImpersonationToken1774443779170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer_impersonation_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "token" character varying NOT NULL, "actorId" uuid NOT NULL, "targetCustomerId" uuid NOT NULL, "targetBranchId" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_dac193573ee76b8a0d4c1fce538" UNIQUE ("token"), CONSTRAINT "PK_4ac62b3155a6c0dc09f0298aa1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dac193573ee76b8a0d4c1fce53" ON "customer_impersonation_tokens" ("token") `);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "actorId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_impersonation_tokens" ADD CONSTRAINT "FK_656b8f75d895893c73c4b258f2d" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_impersonation_tokens" ADD CONSTRAINT "FK_38cbaa26a84189a093243f770c7" FOREIGN KEY ("targetCustomerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_impersonation_tokens" DROP CONSTRAINT "FK_38cbaa26a84189a093243f770c7"`);
        await queryRunner.query(`ALTER TABLE "customer_impersonation_tokens" DROP CONSTRAINT "FK_656b8f75d895893c73c4b258f2d"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "actorId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dac193573ee76b8a0d4c1fce53"`);
        await queryRunner.query(`DROP TABLE "customer_impersonation_tokens"`);
    }

}
