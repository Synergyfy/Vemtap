import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixLoyaltyProfileConstraints1772039150396 implements MigrationInterface {
  name = 'FixLoyaltyProfileConstraints1772039150396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "isVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "branchId" DROP NOT NULL`,
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
      `ALTER TYPE "public"."payments_purpose_enum" RENAME TO "payments_purpose_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_purpose_enum" AS ENUM('Order', 'Subscription', 'Credit Topup')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "purpose" TYPE "public"."payments_purpose_enum" USING "purpose"::"text"::"public"."payments_purpose_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_purpose_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "rewardType" SET DEFAULT 'free_item'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD "metadata" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP COLUMN "tierLevel"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."loyalty_profiles_tierlevel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD "tierLevel" character varying NOT NULL DEFAULT 'bronze'`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "UQ_6e08df45598501197c90afb6e52" UNIQUE ("redemptionCode")`,
    );
    await queryRunner.query(`ALTER TABLE "redemptions" DROP COLUMN "branchId"`);
    await queryRunner.query(`ALTER TABLE "redemptions" ADD "branchId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73106f06fac64eaded06516a3a" ON "loyalty_profiles" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0585b16421a6e388dcf5bb5319" ON "redemptions" ("branchId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_0585b16421a6e388dcf5bb5319e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_0585b16421a6e388dcf5bb5319e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0585b16421a6e388dcf5bb5319"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73106f06fac64eaded06516a3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "redemptions" DROP COLUMN "branchId"`);
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD "branchId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "UQ_6e08df45598501197c90afb6e52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP COLUMN "tierLevel"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loyalty_profiles_tierlevel_enum" AS ENUM('bronze', 'gold', 'platinum', 'silver')`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD "tierLevel" "public"."loyalty_profiles_tierlevel_enum" NOT NULL DEFAULT 'bronze'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD "metadata" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "rewardType" SET DEFAULT 'discount'`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_purpose_enum_old" AS ENUM('Order', 'Subscription')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "purpose" TYPE "public"."payments_purpose_enum_old" USING "purpose"::"text"::"public"."payments_purpose_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_purpose_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payments_purpose_enum_old" RENAME TO "payments_purpose_enum"`,
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
      `ALTER TABLE "visits" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "isVerified"`);
  }
}
