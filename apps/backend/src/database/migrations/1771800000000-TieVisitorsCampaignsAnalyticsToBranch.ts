import { MigrationInterface, QueryRunner } from 'typeorm';

export class TieVisitorsCampaignsAnalyticsToBranch1771800000000 implements MigrationInterface {
  name = 'TieVisitorsCampaignsAnalyticsToBranch1771800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- visits: make branchId required, businessId optional ---
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "visits" v SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = v."businessId" LIMIT 1) WHERE v."branchId" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "branchId" SET NOT NULL`,
    );

    // --- campaigns: add branchId if missing, migrate from businessId if exists, drop businessId ---
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasCampaignBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns' AND column_name='businessId'`,
    );
    if (hasCampaignBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "campaigns" c SET "branchId" = (SELECT b.id FROM "branches" b WHERE b."businessId" = c."businessId" LIMIT 1) WHERE c."branchId" IS NULL`,
      );
      const campaignFk = await queryRunner.query(
        `SELECT tc.constraint_name FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                 WHERE tc.table_schema = 'public' AND tc.table_name = 'campaigns'
                 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'businessId'`,
      );
      if (campaignFk?.length) {
        await queryRunner.query(
          `ALTER TABLE "campaigns" DROP CONSTRAINT "${campaignFk[0].constraint_name}"`,
        );
      }
      await queryRunner.query(
        `ALTER TABLE "campaigns" DROP COLUMN "businessId"`,
      );
    } else {
      await queryRunner.query(
        `UPDATE "campaigns" SET "branchId" = (SELECT id FROM "branches" LIMIT 1) WHERE "branchId" IS NULL`,
      );
    }
    const hasCampaignBranchIdNull = await queryRunner.query(
      `SELECT 1 FROM "campaigns" WHERE "branchId" IS NULL LIMIT 1`,
    );
    if (!hasCampaignBranchIdNull?.length) {
      await queryRunner.query(
        `ALTER TABLE "campaigns" ALTER COLUMN "branchId" SET NOT NULL`,
      );
    }
    const hasCampaignBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='campaigns' AND constraint_name='FK_campaigns_branch'`,
    );
    if (!hasCampaignBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_campaigns_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }

    // --- loyalty_profiles ---
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasLpBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='loyalty_profiles' AND column_name='businessId'`,
    );
    if (hasLpBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "loyalty_profiles" lp SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = lp."businessId" LIMIT 1)`,
      );
      await queryRunner.query(
        `DELETE FROM "loyalty_profiles" WHERE "branchId" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "loyalty_profiles" DROP COLUMN "businessId"`,
      );
    } else {
      await queryRunner.query(
        `UPDATE "loyalty_profiles" SET "branchId" = (SELECT id FROM "branches" LIMIT 1) WHERE "branchId" IS NULL`,
      );
      await queryRunner.query(
        `DELETE FROM "loyalty_profiles" WHERE "branchId" IS NULL`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    const hasLpBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='loyalty_profiles' AND constraint_name='FK_loyalty_profiles_branch'`,
    );
    if (!hasLpBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_loyalty_profiles_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }

    // --- loyalty_rules ---
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasLrBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='loyalty_rules' AND column_name='businessId'`,
    );
    if (hasLrBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "loyalty_rules" lr SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = lr."businessId" LIMIT 1)`,
      );
      await queryRunner.query(
        `DELETE FROM "loyalty_rules" WHERE "branchId" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "loyalty_rules" DROP COLUMN "businessId"`,
      );
    } else {
      await queryRunner.query(
        `UPDATE "loyalty_rules" SET "branchId" = (SELECT id FROM "branches" LIMIT 1) WHERE "branchId" IS NULL`,
      );
      await queryRunner.query(
        `DELETE FROM "loyalty_rules" WHERE "branchId" IS NULL`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    const hasLrBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='loyalty_rules' AND constraint_name='FK_loyalty_rules_branch'`,
    );
    if (!hasLrBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_loyalty_rules_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }

    // --- rewards ---
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasRewardBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rewards' AND column_name='businessId'`,
    );
    if (hasRewardBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "rewards" r SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = r."businessId" LIMIT 1)`,
      );
      await queryRunner.query(`DELETE FROM "rewards" WHERE "branchId" IS NULL`);
      await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN "businessId"`);
    }
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    const hasRewardBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='rewards' AND constraint_name='FK_rewards_branch'`,
    );
    if (!hasRewardBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "rewards" ADD CONSTRAINT "FK_rewards_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }

    // --- campaign_templates ---
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasCtBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaign_templates' AND column_name='businessId'`,
    );
    if (hasCtBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "campaign_templates" ct SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = ct."businessId" LIMIT 1) WHERE ct."businessId" IS NOT NULL`,
      );
      const templateFk = await queryRunner.query(
        `SELECT tc.constraint_name FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                 WHERE tc.table_schema = 'public' AND tc.table_name = 'campaign_templates'
                 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'businessId'`,
      );
      if (templateFk?.length) {
        await queryRunner.query(
          `ALTER TABLE "campaign_templates" DROP CONSTRAINT "${templateFk[0].constraint_name}"`,
        );
      }
      await queryRunner.query(
        `ALTER TABLE "campaign_templates" DROP COLUMN "businessId"`,
      );
    }
    const hasCtBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='campaign_templates' AND constraint_name='FK_campaign_templates_branch'`,
    );
    if (!hasCtBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "campaign_templates" ADD CONSTRAINT "FK_campaign_templates_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL`,
      );
    }

    // --- message_campaigns ---
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    const hasMcBusinessId = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='message_campaigns' AND column_name='businessId'`,
    );
    if (hasMcBusinessId?.length) {
      await queryRunner.query(
        `UPDATE "message_campaigns" mc SET "branchId" = (SELECT id FROM "branches" b WHERE b."businessId" = mc."businessId" LIMIT 1)`,
      );
      await queryRunner.query(
        `DELETE FROM "message_campaigns" WHERE "branchId" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "message_campaigns" DROP CONSTRAINT IF EXISTS "FK_1174f5e555bd3dd92b277bc8f28"`,
      );
      await queryRunner.query(
        `ALTER TABLE "message_campaigns" ALTER COLUMN "branchId" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "message_campaigns" DROP COLUMN "businessId"`,
      );
    }
    const hasMcBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='message_campaigns' AND constraint_name='FK_message_campaigns_branch'`,
    );
    if (!hasMcBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_message_campaigns_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }

    // --- message_logs ---
    await queryRunner.query(
      `ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    const hasMlBranchFk = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='message_logs' AND constraint_name='FK_message_logs_branch'`,
    );
    if (!hasMlBranchFk?.length) {
      await queryRunner.query(
        `ALTER TABLE "message_logs" ADD CONSTRAINT "FK_message_logs_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert logic - simplified; full revert may need manual intervention
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
  }
}
