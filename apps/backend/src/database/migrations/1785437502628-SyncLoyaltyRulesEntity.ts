import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncLoyaltyRulesEntity1785437502628 implements MigrationInterface {
  name = 'SyncLoyaltyRulesEntity1785437502628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_rules' AND table_schema = 'public'`,
    );

    if (tableExists.length === 0) {
      // Table does not exist — create it from scratch
      await queryRunner.query(
        `CREATE TYPE "public"."loyalty_rules_ruletype_enum" AS ENUM('spending', 'visit', 'hybrid')`,
      );
      await queryRunner.query(
        `CREATE TABLE "loyalty_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "ruleType" "public"."loyalty_rules_ruletype_enum" NOT NULL DEFAULT 'hybrid', "isActive" boolean NOT NULL DEFAULT true, "spendingBaseAmount" integer NOT NULL DEFAULT '10', "spendingBasePoints" integer NOT NULL DEFAULT '1', "visitPoints" integer NOT NULL DEFAULT '50', "visitCooldownHours" integer NOT NULL DEFAULT '24', "firstVisitBonus" integer NOT NULL DEFAULT '100', "birthdayBonus" integer NOT NULL DEFAULT '500', "referralBonus" integer NOT NULL DEFAULT '200', CONSTRAINT "PK_94cb1aeb0c0ac95c2e9bbcdbd11" PRIMARY KEY ("id"))`,
      );
      await queryRunner.query(
        `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_e4828c10c6411a5da971e46e237" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    } else {
      // Table exists — only add missing FK constraints (idempotent)
      const fkExists = await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_e4828c10c6411a5da971e46e237'`,
      );
      if (fkExists.length === 0) {
        await queryRunner.query(
          `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_e4828c10c6411a5da971e46e237" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
      const fk2Exists = await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_da0940a87735e5dd87eed2a2eb9'`,
      );
      if (fk2Exists.length === 0) {
        await queryRunner.query(
          `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_rules' AND table_schema = 'public'`,
    );
    if (tableExists.length > 0) {
      const fk1 = await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_da0940a87735e5dd87eed2a2eb9'`,
      );
      if (fk1.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`,
        );
      }
      const fk2 = await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_e4828c10c6411a5da971e46e237'`,
      );
      if (fk2.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_e4828c10c6411a5da971e46e237"`,
        );
      }
      await queryRunner.query(`DROP TABLE "loyalty_rules"`);
      const enumExists = await queryRunner.query(
        `SELECT 1 FROM pg_type WHERE typname = 'loyalty_rules_ruletype_enum'`,
      );
      if (enumExists.length > 0) {
        await queryRunner.query(`DROP TYPE "public"."loyalty_rules_ruletype_enum"`);
      }
    }
  }
}
