import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiscoveryAdminEntities1783792876159 implements MigrationInterface {
    name = 'AddDiscoveryAdminEntities1783792876159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sponsored_campaigns_status_enum" AS ENUM('Active', 'Ended', 'Pending', 'Paused')`);
        await queryRunner.query(`CREATE TABLE "sponsored_campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "name" character varying NOT NULL, "radius" character varying, "budget" numeric(12,2) NOT NULL DEFAULT '0', "spent" numeric(12,2) NOT NULL DEFAULT '0', "duration" character varying, "status" "public"."sponsored_campaigns_status_enum" NOT NULL DEFAULT 'Pending', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "impressions" integer NOT NULL DEFAULT '0', "clicks" integer NOT NULL DEFAULT '0', "conversions" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_23a020e09d9f9869802c2a27292" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sponsored_campaign_transactions_status_enum" AS ENUM('Paid', 'Pending', 'Refunded')`);
        await queryRunner.query(`CREATE TABLE "sponsored_campaign_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "campaignId" uuid NOT NULL, "invoiceNo" character varying, "type" character varying, "amount" numeric(12,2) NOT NULL DEFAULT '0', "status" "public"."sponsored_campaign_transactions_status_enum" NOT NULL DEFAULT 'Paid', "date" TIMESTAMP, CONSTRAINT "PK_05c7f9466a279b5e7ab4c10f543" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."discovery_reports_status_enum" AS ENUM('Ready', 'Processing', 'Failed')`);
        await queryRunner.query(`CREATE TABLE "discovery_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "type" character varying, "dateRange" character varying, "status" "public"."discovery_reports_status_enum" NOT NULL DEFAULT 'Processing', "fileUrl" character varying, "fileSize" character varying, "generatedById" uuid, CONSTRAINT "PK_86dc76709d3bd258cda87938e82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."offer_category_types_status_enum" AS ENUM('Active', 'Inactive')`);
        await queryRunner.query(`CREATE TABLE "offer_category_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text, "status" "public"."offer_category_types_status_enum" NOT NULL DEFAULT 'Active', "offerCount" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_68468439baf19656ae9904dd8ec" UNIQUE ("name"), CONSTRAINT "PK_fd9679b942a0ecdde705945c68f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('Push', 'SMS', 'Email')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('Sent', 'Delivered', 'Failed')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_openstatus_enum" AS ENUM('Opened', 'Unopened', 'N/A')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "recipientId" character varying, "recipientName" character varying, "businessId" uuid, "channel" "public"."notification_logs_channel_enum" NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'Sent', "openStatus" "public"."notification_logs_openstatus_enum" NOT NULL DEFAULT 'N/A', "content" text, "sentAt" TIMESTAMP, CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."discovery_invoices_status_enum" AS ENUM('Paid', 'Pending', 'Overdue')`);
        await queryRunner.query(`CREATE TABLE "discovery_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "invoiceNo" character varying NOT NULL, "description" character varying, "type" character varying, "method" character varying, "status" "public"."discovery_invoices_status_enum" NOT NULL DEFAULT 'Pending', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "tax" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "date" TIMESTAMP, CONSTRAINT "UQ_e9181e4fb435c16cee2437c0ca5" UNIQUE ("invoiceNo"), CONSTRAINT "PK_e9d2ce35a6e317a43c724e30000" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceId" uuid NOT NULL, "description" character varying NOT NULL, "qty" integer NOT NULL DEFAULT '1', "unitPrice" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_4e8ccaadaf5d0619db9d219b061" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."fraud_alerts_severity_enum" AS ENUM('High', 'Medium', 'Low')`);
        await queryRunner.query(`CREATE TYPE "public"."fraud_alerts_status_enum" AS ENUM('Flagged', 'Investigating', 'Resolved')`);
        await queryRunner.query(`CREATE TABLE "fraud_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "type" character varying NOT NULL, "businessId" uuid, "customerId" uuid, "severity" "public"."fraud_alerts_severity_enum" NOT NULL DEFAULT 'Medium', "confidence" integer NOT NULL DEFAULT '0', "status" "public"."fraud_alerts_status_enum" NOT NULL DEFAULT 'Flagged', "reason" text, "deviceFingerprint" character varying, "ipAddress" character varying, "timestamp" TIMESTAMP, CONSTRAINT "PK_d1e5b58078239461d43d906f08e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaigns" ADD CONSTRAINT "FK_9b6b1c26bffbf3698c89ef34d2d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaigns" ADD CONSTRAINT "FK_4455e8754faa386f59c4e3db298" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaign_transactions" ADD CONSTRAINT "FK_f6fc57aacfa8da8d2a2c1882085" FOREIGN KEY ("campaignId") REFERENCES "sponsored_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discovery_reports" ADD CONSTRAINT "FK_38d6dde29a42e469f483f785b26" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discovery_invoices" ADD CONSTRAINT "FK_7e6f7ab7a2f9ce0eb0bd6fd6f48" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_line_items" ADD CONSTRAINT "FK_2ec8b1cda36ed79a7ded49bd913" FOREIGN KEY ("invoiceId") REFERENCES "discovery_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" ADD CONSTRAINT "FK_73689f2b8163acf8be991de94f5" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" ADD CONSTRAINT "FK_0464a0aa1b46bbedf27a25bfce3" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fraud_alerts" DROP CONSTRAINT "FK_0464a0aa1b46bbedf27a25bfce3"`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" DROP CONSTRAINT "FK_73689f2b8163acf8be991de94f5"`);
        await queryRunner.query(`ALTER TABLE "invoice_line_items" DROP CONSTRAINT "FK_2ec8b1cda36ed79a7ded49bd913"`);
        await queryRunner.query(`ALTER TABLE "discovery_invoices" DROP CONSTRAINT "FK_7e6f7ab7a2f9ce0eb0bd6fd6f48"`);
        await queryRunner.query(`ALTER TABLE "discovery_reports" DROP CONSTRAINT "FK_38d6dde29a42e469f483f785b26"`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaign_transactions" DROP CONSTRAINT "FK_f6fc57aacfa8da8d2a2c1882085"`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaigns" DROP CONSTRAINT "FK_4455e8754faa386f59c4e3db298"`);
        await queryRunner.query(`ALTER TABLE "sponsored_campaigns" DROP CONSTRAINT "FK_9b6b1c26bffbf3698c89ef34d2d"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP TABLE "fraud_alerts"`);
        await queryRunner.query(`DROP TYPE "public"."fraud_alerts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fraud_alerts_severity_enum"`);
        await queryRunner.query(`DROP TABLE "invoice_line_items"`);
        await queryRunner.query(`DROP TABLE "discovery_invoices"`);
        await queryRunner.query(`DROP TYPE "public"."discovery_invoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_openstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_channel_enum"`);
        await queryRunner.query(`DROP TABLE "offer_category_types"`);
        await queryRunner.query(`DROP TYPE "public"."offer_category_types_status_enum"`);
        await queryRunner.query(`DROP TABLE "discovery_reports"`);
        await queryRunner.query(`DROP TYPE "public"."discovery_reports_status_enum"`);
        await queryRunner.query(`DROP TABLE "sponsored_campaign_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."sponsored_campaign_transactions_status_enum"`);
        await queryRunner.query(`DROP TABLE "sponsored_campaigns"`);
        await queryRunner.query(`DROP TYPE "public"."sponsored_campaigns_status_enum"`);
    }

}
