import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartnershipsTable1782294062988 implements MigrationInterface {
  name = 'CreatePartnershipsTable1782294062988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."partnerships_status_enum" AS ENUM('Pending', 'Accepted', 'Declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "partnerships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "initiatorBranchId" uuid NOT NULL, "recipientBranchId" uuid NOT NULL, "status" "public"."partnerships_status_enum" NOT NULL DEFAULT 'Pending', CONSTRAINT "UQ_7ce9e3a04cc67c7a69913435623" UNIQUE ("initiatorBranchId", "recipientBranchId"), CONSTRAINT "PK_55de3c169ff0d5d88e9a7cb0cd6" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "partnerships" ADD CONSTRAINT "FK_39b84d18a42bfefc6b1145e2871" FOREIGN KEY ("initiatorBranchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partnerships" ADD CONSTRAINT "FK_4a5ecee4ced26156b0490e10297" FOREIGN KEY ("recipientBranchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partnerships" DROP CONSTRAINT "FK_4a5ecee4ced26156b0490e10297"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partnerships" DROP CONSTRAINT "FK_39b84d18a42bfefc6b1145e2871"`,
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
    await queryRunner.query(`DROP TABLE "partnerships"`);
    await queryRunner.query(`DROP TYPE "public"."partnerships_status_enum"`);
  }
}
