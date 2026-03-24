import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateNoYearToFormFieldType1773863288535 implements MigrationInterface {
  name = 'AddDateNoYearToFormFieldType1773863288535';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TYPE "public"."form_fields_type_enum" RENAME TO "form_fields_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."form_fields_type_enum" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'date-no-year')`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" TYPE "public"."form_fields_type_enum" USING "type"::"text"::"public"."form_fields_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(`DROP TYPE "public"."form_fields_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."form_field_templates_type_enum" RENAME TO "form_field_templates_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."form_field_templates_type_enum" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'date-no-year')`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" TYPE "public"."form_field_templates_type_enum" USING "type"::"text"::"public"."form_field_templates_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."form_field_templates_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."form_field_templates_type_enum_old" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date')`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" TYPE "public"."form_field_templates_type_enum_old" USING "type"::"text"::"public"."form_field_templates_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_field_templates" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."form_field_templates_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."form_field_templates_type_enum_old" RENAME TO "form_field_templates_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."form_fields_type_enum_old" AS ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date')`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" TYPE "public"."form_fields_type_enum_old" USING "type"::"text"::"public"."form_fields_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(`DROP TYPE "public"."form_fields_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."form_fields_type_enum_old" RENAME TO "form_fields_type_enum"`,
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
  }
}
