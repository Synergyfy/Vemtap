import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormsFeature1772711780098 implements MigrationInterface {
    name = 'AddFormsFeature1772711780098'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."form_fields_type_enum" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date')`);
        await queryRunner.query(`CREATE TABLE "form_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "formId" uuid NOT NULL, "type" "public"."form_fields_type_enum" NOT NULL DEFAULT 'text', "question" character varying NOT NULL, "options" text, "isRequired" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_dc4b73290f2926c3a7d7c92d1e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "responseId" uuid NOT NULL, "fieldId" uuid NOT NULL, "value" text, CONSTRAINT "PK_c52f7d73b7cd03332ba47dca123" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "formId" uuid NOT NULL, "visitorId" uuid NOT NULL, "branchId" uuid, CONSTRAINT "PK_36a512e5574d0a366b40b26874e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "isPublished" boolean NOT NULL DEFAULT false, "businessId" uuid NOT NULL, "branchId" uuid, CONSTRAINT "PK_ba062fd30b06814a60756f233da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "form_fields" ADD CONSTRAINT "FK_be6b8d137cc480508923911b0e2" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_answers" ADD CONSTRAINT "FK_8a93549526f1be39e45a93d0a23" FOREIGN KEY ("responseId") REFERENCES "form_responses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_answers" ADD CONSTRAINT "FK_61e00ee7db625bab0668546e199" FOREIGN KEY ("fieldId") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_responses" ADD CONSTRAINT "FK_8e9a32f15bd2485ea908787b634" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_responses" ADD CONSTRAINT "FK_d9235337d85472fe779af8bc250" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_responses" ADD CONSTRAINT "FK_2b3434e575975360f35a93a5b35" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "FK_dabddc5473d389852c78101e682" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "FK_0bf8d10fe55e48c049ccde869f9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" DROP CONSTRAINT "FK_0bf8d10fe55e48c049ccde869f9"`);
        await queryRunner.query(`ALTER TABLE "forms" DROP CONSTRAINT "FK_dabddc5473d389852c78101e682"`);
        await queryRunner.query(`ALTER TABLE "form_responses" DROP CONSTRAINT "FK_2b3434e575975360f35a93a5b35"`);
        await queryRunner.query(`ALTER TABLE "form_responses" DROP CONSTRAINT "FK_d9235337d85472fe779af8bc250"`);
        await queryRunner.query(`ALTER TABLE "form_responses" DROP CONSTRAINT "FK_8e9a32f15bd2485ea908787b634"`);
        await queryRunner.query(`ALTER TABLE "form_answers" DROP CONSTRAINT "FK_61e00ee7db625bab0668546e199"`);
        await queryRunner.query(`ALTER TABLE "form_answers" DROP CONSTRAINT "FK_8a93549526f1be39e45a93d0a23"`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP CONSTRAINT "FK_be6b8d137cc480508923911b0e2"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP TABLE "forms"`);
        await queryRunner.query(`DROP TABLE "form_responses"`);
        await queryRunner.query(`DROP TABLE "form_answers"`);
        await queryRunner.query(`DROP TABLE "form_fields"`);
        await queryRunner.query(`DROP TYPE "public"."form_fields_type_enum"`);
    }

}
