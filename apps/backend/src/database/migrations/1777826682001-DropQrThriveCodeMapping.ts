import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropQrThriveCodeMapping1777826682001 implements MigrationInterface {
  name = 'DropQrThriveCodeMapping1777826682001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "qr_thrive_code_mappings"`);
    await queryRunner.query(
      `DROP TYPE "public"."qr_thrive_code_mappings_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."qr_thrive_code_mappings_type_enum" AS ENUM('url', 'text', 'vcard', 'wifi', 'email', 'sms', 'whatsapp', 'phone', 'instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok', 'crypto', 'socials', 'links', 'image', 'event', 'pdf', 'video', 'mp3', 'app', 'business', 'menu', 'coupon', 'form', 'booking')`,
    );
    await queryRunner.query(
      `CREATE TABLE "qr_thrive_code_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "qrThriveCodeId" character varying NOT NULL, "shortId" character varying NOT NULL, "name" character varying NOT NULL, "type" "public"."qr_thrive_code_mappings_type_enum" NOT NULL, "config" jsonb, "clicks" integer NOT NULL DEFAULT '0', "branchId" uuid NOT NULL, "qrThriveUserId" character varying, "isFeaturedOnUbl" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_28fe467ea1be1e4955694c18854" UNIQUE ("qrThriveCodeId"), CONSTRAINT "PK_8dcec03889838857d7cc9571c13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_thrive_code_mappings" ADD CONSTRAINT "FK_850ed9b72b478b52cf405e035a7" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
