import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoriesAndSubcategories1773070106121 implements MigrationInterface {
    name = 'AddCategoriesAndSubcategories1773070106121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text, "categoryId" uuid NOT NULL, CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "subcategoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "otherSubcategoryName" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "logoUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "website" character varying`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "whatsappNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "FK_d1fe096726c3c5b8a500950e448" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_4d7c89efebdcbe7f54e92f5eed8" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_26acd0c3cb68438570451533a60" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_26acd0c3cb68438570451533a60"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_4d7c89efebdcbe7f54e92f5eed8"`);
        await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_d1fe096726c3c5b8a500950e448"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "whatsappNumber"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "website"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "logoUrl"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "otherSubcategoryName"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "subcategoryId"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "category" character varying`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "subcategories"`);
    }

}
