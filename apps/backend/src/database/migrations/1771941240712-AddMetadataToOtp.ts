import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataToOtp1771941240712 implements MigrationInterface {
  name = 'AddMetadataToOtp1771941240712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ddb9c853d8602bea573b46334b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_73106f06fac64eaded06516a3a4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80d0596c9acaf40cf1ba7175ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e511eec2dd0a93192bdfdcd4de"`,
    );
    await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN "businessId"`);
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(`ALTER TABLE "redemptions" DROP COLUMN "branchId"`);
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD "branchId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "otps" ADD "metadata" jsonb`);
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
      `ALTER TABLE "redemptions" DROP CONSTRAINT "UQ_6e08df45598501197c90afb6e52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "rewardType" SET DEFAULT 'free_item'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" SET NOT NULL`,
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
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e511eec2dd0a93192bdfdcd4de" ON "loyalty_profiles" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d0596c9acaf40cf1ba7175ae" ON "loyalty_profiles" ("branchId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_73106f06fac64eaded06516a3a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ddb9c853d8602bea573b46334b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_73106f06fac64eaded06516a3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80d0596c9acaf40cf1ba7175ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e511eec2dd0a93192bdfdcd4de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "redeemedAt" DROP NOT NULL`,
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
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "rewardType" SET DEFAULT 'discount'`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "UQ_6e08df45598501197c90afb6e52" UNIQUE ("redemptionCode")`,
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
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "redemptions" DROP COLUMN "branchId"`);
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN "businessId"`);
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD "branchId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e511eec2dd0a93192bdfdcd4de" ON "loyalty_profiles" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d0596c9acaf40cf1ba7175ae" ON "loyalty_profiles" ("branchId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_73106f06fac64eaded06516a3a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
