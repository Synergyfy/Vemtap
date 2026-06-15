import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarketingInfrastructure1780500000000 implements MigrationInterface {
    name = 'AddMarketingInfrastructure1780500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "marketing_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "icon" character varying, "color" character varying, "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_marketing_categories" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "marketing_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "key" character varying NOT NULL, "value" text NOT NULL, "type" character varying, "description" character varying, CONSTRAINT "UQ_marketing_settings_key" UNIQUE ("key"), CONSTRAINT "PK_marketing_settings" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "marketing_brand_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "logoRequired" boolean NOT NULL DEFAULT true, "primaryColorRequired" boolean NOT NULL DEFAULT true, "secondaryColorRequired" boolean NOT NULL DEFAULT false, "fontFamilyRequired" boolean NOT NULL DEFAULT false, "website" character varying, "phone" character varying, "email" character varying, "socialLinks" jsonb, CONSTRAINT "UQ_marketing_brand_rules_businessId" UNIQUE ("businessId"), CONSTRAINT "REL_marketing_brand_rules_businessId" UNIQUE ("businessId"), CONSTRAINT "PK_marketing_brand_rules" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "marketing_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "userId" uuid NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" uuid NOT NULL, "details" jsonb, "ipAddress" character varying, CONSTRAINT "PK_marketing_audit_logs" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "marketing_templates" ADD "categoryId" uuid`);

        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" ADD "website" character varying`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" ADD "socialLinks" jsonb`);

        await queryRunner.query(`ALTER TABLE "marketing_templates" ADD CONSTRAINT "FK_marketing_templates_categoryId" FOREIGN KEY ("categoryId") REFERENCES "marketing_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "marketing_brand_rules" ADD CONSTRAINT "FK_marketing_brand_rules_businessId" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "marketing_brand_rules" DROP CONSTRAINT "FK_marketing_brand_rules_businessId"`);

        await queryRunner.query(`ALTER TABLE "marketing_templates" DROP CONSTRAINT "FK_marketing_templates_categoryId"`);

        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" DROP COLUMN "socialLinks"`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "marketing_brand_overrides" DROP COLUMN "website"`);

        await queryRunner.query(`ALTER TABLE "marketing_templates" DROP COLUMN "categoryId"`);

        await queryRunner.query(`DROP TABLE "marketing_audit_logs"`);
        await queryRunner.query(`DROP TABLE "marketing_brand_rules"`);
        await queryRunner.query(`DROP TABLE "marketing_settings"`);
        await queryRunner.query(`DROP TABLE "marketing_categories"`);
    }
}
