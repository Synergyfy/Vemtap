import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductAndOrderEntities1775395313432 implements MigrationInterface {
  name = 'UpdateProductAndOrderEntities1775395313432';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "originalPrice" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "costPrice" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "customizationFee" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "nfcType" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "businessId" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('Pending', 'Processing', 'Ready', 'Completed', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"text"::"public"."orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'Pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum_old"`);
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
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_778777c5d7d56ed1bbaa907b8e5" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_778777c5d7d56ed1bbaa907b8e5"`,
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
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum_old" AS ENUM('Pending', 'Ready', 'Completed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'Pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "businessId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "nfcType"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "customizationFee"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "costPrice"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "originalPrice"`,
    );
  }
}
