import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceLoyaltySupportStatus1785867923679 implements MigrationInterface {
  name = 'AddMarketplaceLoyaltySupportStatus1785867923679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."product_reviews_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "productId" uuid NOT NULL, "userId" character varying, "reviewerName" character varying NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "status" "public"."product_reviews_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_67c1501aea1b0633ec441b00bd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32edd80d91dff1bc19e79c8f16" ON "product_reviews" ("productId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."system_components_status_enum" AS ENUM('operational', 'degraded', 'outage')`,
    );
    await queryRunner.query(
      `CREATE TABLE "system_components" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "slug" character varying NOT NULL, "name" character varying NOT NULL, "status" "public"."system_components_status_enum" NOT NULL DEFAULT 'operational', "latencyMs" integer, "uptime90d" character varying NOT NULL DEFAULT '99.98%', "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_56e8083652b4455210185d52e04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_106727f20c42a818929869f103" ON "system_components" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_severity_enum" AS ENUM('minor', 'major', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_status_enum" AS ENUM('investigating', 'identified', 'monitoring', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" text NOT NULL, "componentSlug" character varying, "severity" "public"."incidents_severity_enum" NOT NULL DEFAULT 'minor', "status" "public"."incidents_status_enum" NOT NULL DEFAULT 'investigating', "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "resolvedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_255ad513f8cd67aa4305b1b068" ON "incidents" ("occurredAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "reviewCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ADD "attachments" jsonb`,
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
      `ALTER TABLE "product_reviews" ADD CONSTRAINT "FK_32edd80d91dff1bc19e79c8f16d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_reviews" DROP CONSTRAINT "FK_32edd80d91dff1bc19e79c8f16d"`,
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
      `ALTER TABLE "ticket_messages" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "reviewCount"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_255ad513f8cd67aa4305b1b068"`,
    );
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TYPE "public"."incidents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."incidents_severity_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_106727f20c42a818929869f103"`,
    );
    await queryRunner.query(`DROP TABLE "system_components"`);
    await queryRunner.query(
      `DROP TYPE "public"."system_components_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32edd80d91dff1bc19e79c8f16"`,
    );
    await queryRunner.query(`DROP TABLE "product_reviews"`);
    await queryRunner.query(`DROP TYPE "public"."product_reviews_status_enum"`);
  }
}
