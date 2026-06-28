import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddonsTables1700000000000 implements MigrationInterface {
  name = 'CreateAddonsTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "addons_type_enum" AS ENUM ('RESOURCE', 'SERVICE')
    `);

    await queryRunner.query(`
      CREATE TABLE "addons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" text,
        "type" "addons_type_enum" NOT NULL,
        "price" decimal(10,2) NOT NULL DEFAULT 0,
        "durationDays" integer NOT NULL DEFAULT 30,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "isActive" boolean NOT NULL DEFAULT true,
        "targetCapability" character varying,
        "additionalLimit" integer,
        "serviceDetails" jsonb,
        "isOneTime" boolean NOT NULL DEFAULT false,
        "isRecurring" boolean NOT NULL DEFAULT false,
        "imageUrl" character varying,
        CONSTRAINT "PK_addons" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "business_addons_status_enum" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED')
    `);

    await queryRunner.query(`
      CREATE TABLE "business_addons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "addonId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "status" "business_addons_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "purchasedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "totalPaid" decimal(10,2) NOT NULL DEFAULT 0,
        "paymentReference" character varying,
        "paystackAuthorizationCode" text,
        "metadata" jsonb,
        CONSTRAINT "PK_business_addons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_business_addons_addon" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_business_addons_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_business_addons_businessId" ON "business_addons" ("businessId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_business_addons_status" ON "business_addons" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_business_addons_expiresAt" ON "business_addons" ("expiresAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_business_addons_addonId" ON "business_addons" ("addonId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_addons_isActive" ON "addons" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_addons_type" ON "addons" ("type")
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."payments_purpose_enum" ADD VALUE IF NOT EXISTS 'Addon'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."payments_purpose_enum" ADD VALUE IF NOT EXISTS 'Plan With Addons'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_addons_type"`);
    await queryRunner.query(`DROP INDEX "IDX_addons_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_business_addons_addonId"`);
    await queryRunner.query(`DROP INDEX "IDX_business_addons_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_business_addons_status"`);
    await queryRunner.query(`DROP INDEX "IDX_business_addons_businessId"`);
    await queryRunner.query(`DROP TABLE "business_addons"`);
    await queryRunner.query(`DROP TYPE "business_addons_status_enum"`);
    await queryRunner.query(`DROP TABLE "addons"`);
    await queryRunner.query(`DROP TYPE "addons_type_enum"`);
  }
}
