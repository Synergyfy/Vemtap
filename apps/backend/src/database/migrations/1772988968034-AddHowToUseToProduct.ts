import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHowToUseToProduct1772988968034 implements MigrationInterface {
    name = 'AddHowToUseToProduct1772988968034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."form_field_templates_type_enum" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date')`);
        await queryRunner.query(`CREATE TABLE "form_field_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "templateId" uuid NOT NULL, "type" "public"."form_field_templates_type_enum" NOT NULL DEFAULT 'text', "question" character varying NOT NULL, "options" text, "isRequired" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_09d0974f8f815df0ffff5786938" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_dda93f70be71cb4a2e496b5ae49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "howToUse" text`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "form_field_templates" ADD CONSTRAINT "FK_8aa444746db3d86ed3b8553cef2" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form_field_templates" DROP CONSTRAINT "FK_8aa444746db3d86ed3b8553cef2"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "howToUse"`);
        await queryRunner.query(`DROP TABLE "form_templates"`);
        await queryRunner.query(`DROP TABLE "form_field_templates"`);
        await queryRunner.query(`DROP TYPE "public"."form_field_templates_type_enum"`);
    }

}
