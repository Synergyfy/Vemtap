import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBusinessProfileTable1775482873274 implements MigrationInterface {
    name = 'CreateBusinessProfileTable1775482873274'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."business_profiles_priority_enum" AS ENUM('High', 'Medium', 'Low')`);
        await queryRunner.query(`CREATE TYPE "public"."business_profiles_status_enum" AS ENUM('Not Contacted', 'Contacted', 'Interested', 'Closed')`);
        await queryRunner.query(`CREATE TABLE "business_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessName" character varying NOT NULL, "location" character varying NOT NULL, "businessType" character varying NOT NULL, "physicalSetup" jsonb NOT NULL DEFAULT '{}', "qrPlacement" jsonb NOT NULL DEFAULT '{}', "priority" "public"."business_profiles_priority_enum" NOT NULL DEFAULT 'Low', "status" "public"."business_profiles_status_enum" NOT NULL DEFAULT 'Not Contacted', "score" integer NOT NULL DEFAULT '0', "insights" jsonb NOT NULL DEFAULT '{}', "notes" text, "createdById" uuid, CONSTRAINT "PK_29525485b1db8e87caf6a5ef042" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "optOut" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_d502be280f54dd0d8026952d8af"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_8b07db435b93c859e795b557da6"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_0b2b55924c7a46d696890606800"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "customerId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "givenById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "branchId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_d502be280f54dd0d8026952d8af" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_8b07db435b93c859e795b557da6" FOREIGN KEY ("givenById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_0b2b55924c7a46d696890606800" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD CONSTRAINT "FK_61baaabecdbdc76c0f9782feb77" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP CONSTRAINT "FK_61baaabecdbdc76c0f9782feb77"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_0b2b55924c7a46d696890606800"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_8b07db435b93c859e795b557da6"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_d502be280f54dd0d8026952d8af"`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "branchId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "givenById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ALTER COLUMN "customerId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_0b2b55924c7a46d696890606800" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_8b07db435b93c859e795b557da6" FOREIGN KEY ("givenById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_d502be280f54dd0d8026952d8af" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "optOut" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "business_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."business_profiles_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."business_profiles_priority_enum"`);
    }

}
