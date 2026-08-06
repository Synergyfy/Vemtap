import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingAssetsTable1780320159593 implements MigrationInterface {
  name = 'AddMarketingAssetsTable1780320159593';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "marketing_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "category" character varying NOT NULL, "type" character varying NOT NULL, "layoutConfig" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "thumbnailUrl" character varying, "qrCodeConfig" jsonb, CONSTRAINT "PK_cd0d1e159fc3abca45dcc7b2677" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_mockups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "type" character varying NOT NULL, "imageUrl" character varying NOT NULL, "overlayConfig" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_df3641df6e2a4e9a9baef701d0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "businessId" uuid NOT NULL, "branchId" uuid, "templateId" uuid, "type" character varying NOT NULL, "customConfig" jsonb NOT NULL, "qrCodeContent" character varying NOT NULL, "qrCodeConfig" jsonb, "thumbnailUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e95135aa15bc6bd11edb40986ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_downloads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "assetId" uuid NOT NULL, "businessId" uuid NOT NULL, "format" character varying NOT NULL, "downloadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a610657ac55c2072097dedca97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_brand_overrides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "logoUrl" character varying, "primaryColor" character varying, "secondaryColor" character varying, "accentColor" character varying, "tagline" character varying, "fontFamily" character varying, CONSTRAINT "UQ_7212bd4e3b132e776d84b79914b" UNIQUE ("businessId"), CONSTRAINT "REL_7212bd4e3b132e776d84b79914" UNIQUE ("businessId"), CONSTRAINT "PK_128dc054e2ea0f548785280a2b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_asset_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "assetId" uuid NOT NULL, "version" integer NOT NULL, "customConfig" jsonb NOT NULL, "createdById" uuid, CONSTRAINT "PK_f6407363f80fd7e1340b3586d8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "assetId" uuid NOT NULL, "businessId" uuid NOT NULL, "scansCount" integer NOT NULL DEFAULT '0', "viewsCount" integer NOT NULL DEFAULT '0', "date" date NOT NULL, CONSTRAINT "PK_b148301b17424b15f3edb4f415c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_ai_prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "category" character varying NOT NULL, "promptTemplate" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_489fca50ffef3a3cd0cdca9d48e" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "marketing_assets" ADD CONSTRAINT "FK_140254ff34f25cd152e727ffc43" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_assets" ADD CONSTRAINT "FK_189f4a64db3c328b2576b43ec7e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_assets" ADD CONSTRAINT "FK_2827dee9d117c0944e9f76fb26e" FOREIGN KEY ("templateId") REFERENCES "marketing_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_downloads" ADD CONSTRAINT "FK_fefbe580a087a1220798b3f80da" FOREIGN KEY ("assetId") REFERENCES "marketing_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_downloads" ADD CONSTRAINT "FK_988c2916c11f81aaba7b7a1897f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_brand_overrides" ADD CONSTRAINT "FK_7212bd4e3b132e776d84b79914b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_asset_versions" ADD CONSTRAINT "FK_c872bd9b26f869165cdb429e317" FOREIGN KEY ("assetId") REFERENCES "marketing_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_asset_versions" ADD CONSTRAINT "FK_16464826107f2509518ae636304" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_analytics" ADD CONSTRAINT "FK_52e91cd174580d13de14b8125cf" FOREIGN KEY ("assetId") REFERENCES "marketing_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_analytics" ADD CONSTRAINT "FK_d19ac23321a925d688f72e8b859" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "marketing_analytics" DROP CONSTRAINT "FK_d19ac23321a925d688f72e8b859"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_analytics" DROP CONSTRAINT "FK_52e91cd174580d13de14b8125cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_asset_versions" DROP CONSTRAINT "FK_16464826107f2509518ae636304"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_asset_versions" DROP CONSTRAINT "FK_c872bd9b26f869165cdb429e317"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_brand_overrides" DROP CONSTRAINT "FK_7212bd4e3b132e776d84b79914b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_downloads" DROP CONSTRAINT "FK_988c2916c11f81aaba7b7a1897f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_downloads" DROP CONSTRAINT "FK_fefbe580a087a1220798b3f80da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_assets" DROP CONSTRAINT "FK_2827dee9d117c0944e9f76fb26e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_assets" DROP CONSTRAINT "FK_189f4a64db3c328b2576b43ec7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_assets" DROP CONSTRAINT "FK_140254ff34f25cd152e727ffc43"`,
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
    await queryRunner.query(`DROP TABLE "marketing_ai_prompts"`);
    await queryRunner.query(`DROP TABLE "marketing_analytics"`);
    await queryRunner.query(`DROP TABLE "marketing_asset_versions"`);
    await queryRunner.query(`DROP TABLE "marketing_brand_overrides"`);
    await queryRunner.query(`DROP TABLE "marketing_downloads"`);
    await queryRunner.query(`DROP TABLE "marketing_assets"`);
    await queryRunner.query(`DROP TABLE "marketing_mockups"`);
    await queryRunner.query(`DROP TABLE "marketing_templates"`);
  }
}
