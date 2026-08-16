import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTaxConfigsTable1786920000000
  implements MigrationInterface
{
  name = 'CreateSubscriptionTaxConfigsTable1786920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscription_tax_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL DEFAULT 'VAT',
        "taxType" character varying NOT NULL DEFAULT 'percentage',
        "rate" numeric(10,2) NOT NULL DEFAULT '0.00',
        "isEnabled" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "changedById" uuid,
        "changeReason" text,
        CONSTRAINT "PK_sub_tax_configs_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscription_tax_configs" ADD CONSTRAINT "FK_sub_tax_configs_changed_by" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_sub_tax_configs_is_active" ON "subscription_tax_configs" ("isActive")`,
    );

    // Seed initial default VAT configuration (7.5% disabled by default)
    await queryRunner.query(
      `INSERT INTO "subscription_tax_configs" ("name", "taxType", "rate", "isEnabled", "isActive", "changeReason")
       VALUES ('VAT', 'percentage', 7.50, false, true, 'Initial default VAT configuration')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sub_tax_configs_is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_tax_configs" DROP CONSTRAINT "FK_sub_tax_configs_changed_by"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_tax_configs"`);
  }
}
