import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlowEngineTables1772546941990 implements MigrationInterface {
  name = 'AddFlowEngineTables1772546941990';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "flow_trigger_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "key" character varying NOT NULL, "label" character varying NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "inactivityDays" integer, CONSTRAINT "UQ_e2ab9570dc3e8f4a8d97be07013" UNIQUE ("key"), CONSTRAINT "PK_bc27903f4b35373ffeb71c8ebd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "flow_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "triggerType" character varying NOT NULL, "version" character varying NOT NULL DEFAULT 'v1', "status" character varying NOT NULL DEFAULT 'active', "structure" jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}', CONSTRAINT "PK_99d311dfe3e94fc45a38d90df19" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "flow_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "flowSessionId" uuid NOT NULL, "businessId" uuid NOT NULL, "actionType" character varying NOT NULL, "isError" boolean NOT NULL DEFAULT false, "message" character varying NOT NULL, "details" jsonb, CONSTRAINT "PK_9a57c5a68424a13d4ead0e3211f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "whatsappApiToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "whatsappWebhookVerifyToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "whatsappBusinessId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "whatsappApiBaseUrl" character varying NOT NULL DEFAULT 'https://graph.facebook.com/v17.0/'`,
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
      `ALTER TABLE "flow_logs" ADD CONSTRAINT "FK_6266e50486828fe7acee0227b64" FOREIGN KEY ("flowSessionId") REFERENCES "flow_executions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" ADD CONSTRAINT "FK_cd00964004b0c83a1fe754abd96" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow_logs" DROP CONSTRAINT "FK_cd00964004b0c83a1fe754abd96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" DROP CONSTRAINT "FK_6266e50486828fe7acee0227b64"`,
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
      `ALTER TABLE "settings" DROP COLUMN "whatsappApiBaseUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappBusinessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappWebhookVerifyToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappApiToken"`,
    );
    await queryRunner.query(`DROP TABLE "flow_logs"`);
    await queryRunner.query(`DROP TABLE "flow_templates"`);
    await queryRunner.query(`DROP TABLE "flow_trigger_configs"`);
  }
}
