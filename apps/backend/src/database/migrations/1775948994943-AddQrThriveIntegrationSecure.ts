import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrThriveIntegrationSecure1775948994943 implements MigrationInterface {
  name = 'AddQrThriveIntegrationSecure1775948994943';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "qr_thrive_user_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "qrThriveUserId" character varying NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_febac9f73ade5c4195cb8f5a2b5" UNIQUE ("qrThriveUserId"), CONSTRAINT "UQ_d268344e12a323b9f3e68a44a9c" UNIQUE ("userId"), CONSTRAINT "REL_d268344e12a323b9f3e68a44a9" UNIQUE ("userId"), CONSTRAINT "PK_1952b856c05c15d32d31bdf66de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."qr_thrive_code_mappings_type_enum" AS ENUM('url', 'text', 'vcard', 'wifi', 'email', 'sms', 'whatsapp', 'phone', 'instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok', 'crypto', 'socials', 'links', 'image', 'event', 'pdf', 'video', 'mp3', 'app', 'business', 'menu', 'coupon', 'form')`,
    );
    await queryRunner.query(
      `CREATE TABLE "qr_thrive_code_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "qrThriveCodeId" character varying NOT NULL, "shortId" character varying NOT NULL, "name" character varying NOT NULL, "type" "public"."qr_thrive_code_mappings_type_enum" NOT NULL, "config" jsonb, "clicks" integer NOT NULL DEFAULT '0', "branchId" uuid NOT NULL, "qrThriveUserId" character varying, CONSTRAINT "UQ_28fe467ea1be1e4955694c18854" UNIQUE ("qrThriveCodeId"), CONSTRAINT "PK_8dcec03889838857d7cc9571c13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_28fe467ea1be1e4955694c1885" ON "qr_thrive_code_mappings" ("qrThriveCodeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78a215b95c6abfbd3ad2524882" ON "qr_thrive_code_mappings" ("shortId") `,
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
      `ALTER TABLE "qr_thrive_user_mappings" ADD CONSTRAINT "FK_d268344e12a323b9f3e68a44a9c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_thrive_code_mappings" ADD CONSTRAINT "FK_850ed9b72b478b52cf405e035a7" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_thrive_code_mappings" DROP CONSTRAINT "FK_850ed9b72b478b52cf405e035a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_thrive_user_mappings" DROP CONSTRAINT "FK_d268344e12a323b9f3e68a44a9c"`,
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
      `DROP INDEX "public"."IDX_78a215b95c6abfbd3ad2524882"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28fe467ea1be1e4955694c1885"`,
    );
    await queryRunner.query(`DROP TABLE "qr_thrive_code_mappings"`);
    await queryRunner.query(
      `DROP TYPE "public"."qr_thrive_code_mappings_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "qr_thrive_user_mappings"`);
  }
}
