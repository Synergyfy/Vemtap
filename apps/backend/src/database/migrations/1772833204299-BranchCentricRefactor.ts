import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchCentricRefactor1772833204299 implements MigrationInterface {
  name = 'BranchCentricRefactor1772833204299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "FK_287b0bb37bfab02d52698eea64b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_78725ac7117e7526e028014606b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_0b06457274d1f798765e0f54894"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_3120dad6f15b9eb17b57deee7a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" DROP CONSTRAINT "FK_c8b08348006a523cf8867b8d0f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_182cffea6be89d674dae3c6431f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2234441aac965d27bd93edb33d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" DROP CONSTRAINT "FK_6cd8838fbb238db1495c608464d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_7d660298759f3645a33f8c2a5f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" DROP CONSTRAINT "FK_3da537da5efbca752e2a30914b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" DROP CONSTRAINT "FK_cd00964004b0c83a1fe754abd96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" DROP CONSTRAINT "FK_f11168a7a26a635338f6aa21350"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" DROP CONSTRAINT "FK_e1e14056207167432227f0eac8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" DROP CONSTRAINT "FK_dabddc5473d389852c78101e682"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_73106f06fac64eaded06516a3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" RENAME COLUMN "businessId" TO "branchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" RENAME COLUMN "businessId" TO "branchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" RENAME COLUMN "businessId" TO "branchId"`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "about"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "rewardEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "officialEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "successMessage"`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "logoUrl"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "whatsappNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "website"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "businessHours"`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "reviewUrl"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "rewardVisitThreshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "linkedinUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "welcomeMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "privacyMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "rewardMessage"`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "address"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "showSocial"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "showReview"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "showFeedback"`,
    );
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "businessId"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "businessId"`);
    await queryRunner.query(
      `ALTER TABLE "message_logs" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" ADD "businessId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD "branchId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "isMainBranch" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "logoUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "website" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "whatsappNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "officialEmail" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "branches" ADD "welcomeMessage" text`);
    await queryRunner.query(`ALTER TABLE "branches" ADD "successMessage" text`);
    await queryRunner.query(`ALTER TABLE "branches" ADD "privacyMessage" text`);
    await queryRunner.query(`ALTER TABLE "branches" ADD "rewardMessage" text`);
    await queryRunner.query(`ALTER TABLE "branches" ADD "about" text`);
    await queryRunner.query(`ALTER TABLE "branches" ADD "businessHours" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "rewardEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "rewardVisitThreshold" integer NOT NULL DEFAULT '5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "linkedinUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "reviewUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "showReview" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "showSocial" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "showFeedback" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "contacts" ADD "branchId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "from" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "to" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" ADD "businessId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD "pointsRequired" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD "businessId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD "points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD "points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "redemptions" ADD "businessId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ADD "businessId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" ADD "businessId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" ALTER COLUMN "branchId" DROP NOT NULL`,
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
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ALTER COLUMN "branchId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1616d2a7df0c5b8c953d0b90fd" ON "redemptions" ("businessId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c" UNIQUE ("branchId", "name", "channel")`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel")`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "FK_aa55f75ea880e40fc080c41c5e7" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_0b06457274d1f798765e0f54894" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Data cleanup for surveys: existing data in branchId (renamed from businessId) will fail FK
    await queryRunner.query(`UPDATE "surveys" SET "branchId" = NULL`);

    await queryRunner.query(
      `ALTER TABLE "surveys" ADD CONSTRAINT "FK_4533b924f7bc98b20bfa0154e13" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_027fc6266b4872da233f67f6114" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" ADD CONSTRAINT "FK_d8230e9d51ba057b6a20e2f32f6" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" ADD CONSTRAINT "FK_c1570b5f605d1ccf2ce2c86ad27" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" DROP CONSTRAINT "FK_c1570b5f605d1ccf2ce2c86ad27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" DROP CONSTRAINT "FK_d8230e9d51ba057b6a20e2f32f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_027fc6266b4872da233f67f6114"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" DROP CONSTRAINT "FK_4533b924f7bc98b20bfa0154e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_0b06457274d1f798765e0f54894"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "FK_aa55f75ea880e40fc080c41c5e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "UQ_d5039383db58f7ca8fa61ade02c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1616d2a7df0c5b8c953d0b90fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel")`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "surveys" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "branchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP COLUMN "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP COLUMN "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP COLUMN "pointsRequired"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_responses" DROP COLUMN "businessId"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "branchId"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "showFeedback"`,
    );
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "showSocial"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "showReview"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "reviewUrl"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "linkedinUrl"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "rewardVisitThreshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "rewardEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "businessHours"`,
    );
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "about"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "rewardMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "privacyMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "successMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "welcomeMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "officialEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "whatsappNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "website"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "logoUrl"`);
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN "isMainBranch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP COLUMN "branchId"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "businessId"`);
    await queryRunner.query(`ALTER TABLE "message_logs" ADD "businessId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "businessId" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "devices" ADD "businessId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "showFeedback" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "showReview" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "showSocial" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "rewardMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "privacyMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "welcomeMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "linkedinUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "rewardVisitThreshold" integer NOT NULL DEFAULT '5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "reviewUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "businessHours" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "website" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "whatsappNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "logoUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "successMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "officialEmail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "rewardEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "businesses" ADD "about" text`);
    await queryRunner.query(
      `ALTER TABLE "business_credits" RENAME COLUMN "branchId" TO "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" RENAME COLUMN "branchId" TO "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" RENAME COLUMN "branchId" TO "businessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4" UNIQUE ("businessId", "channel", "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_73106f06fac64eaded06516a3a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" ADD CONSTRAINT "FK_dabddc5473d389852c78101e682" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ADD CONSTRAINT "FK_e1e14056207167432227f0eac8f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" ADD CONSTRAINT "FK_f11168a7a26a635338f6aa21350" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_logs" ADD CONSTRAINT "FK_cd00964004b0c83a1fe754abd96" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" ADD CONSTRAINT "FK_3da537da5efbca752e2a30914b1" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_7d660298759f3645a33f8c2a5f8" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" ADD CONSTRAINT "FK_6cd8838fbb238db1495c608464d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2234441aac965d27bd93edb33d6" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_182cffea6be89d674dae3c6431f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" ADD CONSTRAINT "FK_c8b08348006a523cf8867b8d0f4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_3120dad6f15b9eb17b57deee7a6" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_0b06457274d1f798765e0f54894" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_78725ac7117e7526e028014606b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_1174f5e555bd3dd92b277bc8f28" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "FK_287b0bb37bfab02d52698eea64b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
