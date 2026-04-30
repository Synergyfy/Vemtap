import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAffiliateSystem1775825076625 implements MigrationInterface {
  name = 'AddAffiliateSystem1775825076625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "training_courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" text NOT NULL, "thumbnailUrl" character varying, "order" integer NOT NULL DEFAULT '0', "level" character varying NOT NULL DEFAULT 'Beginner', "duration" character varying, "scenarios" json, "quiz" json, CONSTRAINT "PK_13bbeecb2ed8a1f45be3c02d68e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "courseId" uuid NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "videoUrl" character varying, "summary" text, "duration" character varying, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_77ee4d25f2d0df7a3d66a873aa5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_commissions_status_enum" AS ENUM('Pending', 'Paid', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "affiliate_commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "affiliateId" uuid NOT NULL, "referralId" uuid NOT NULL, "amount" numeric(20,2) NOT NULL, "status" "public"."affiliate_commissions_status_enum" NOT NULL DEFAULT 'Pending', "description" character varying NOT NULL, "paymentId" uuid, "referredBusinessId" uuid, CONSTRAINT "PK_77280f803a87debac03319456b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_referrals_status_enum" AS ENUM('Pending', 'Converted', 'Expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "affiliate_referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "affiliateId" uuid NOT NULL, "referredBusinessId" uuid, "referredUserId" uuid, "status" "public"."affiliate_referrals_status_enum" NOT NULL DEFAULT 'Pending', "convertedAt" TIMESTAMP, CONSTRAINT "PK_edd63337ee288c94db0a6b6772c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_profiles_tier_enum" AS ENUM('Bronze', 'Silver', 'Gold', 'Platinum')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_profiles_kycstatus_enum" AS ENUM('unverified', 'pending', 'verified')`,
    );
    await queryRunner.query(
      `CREATE TABLE "affiliate_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "referralCode" character varying NOT NULL, "totalEarnings" numeric(20,2) NOT NULL DEFAULT '0', "availableBalance" numeric(20,2) NOT NULL DEFAULT '0', "withdrawalsCount" numeric(20,2) NOT NULL DEFAULT '0', "tier" "public"."affiliate_profiles_tier_enum" NOT NULL DEFAULT 'Bronze', "kycStatus" "public"."affiliate_profiles_kycstatus_enum" NOT NULL DEFAULT 'unverified', "idType" character varying, "idNumber" character varying, "idImageUrl" character varying, "bankAccountDetails" jsonb, "completedModules" text array NOT NULL DEFAULT '{}', "trainingScore" integer NOT NULL DEFAULT '0', "isFlagged" boolean NOT NULL DEFAULT false, "fraudReason" character varying, CONSTRAINT "UQ_5af134ef88230432aced6b230ed" UNIQUE ("referralCode"), CONSTRAINT "REL_83755235707b72b56985c1f986" UNIQUE ("userId"), CONSTRAINT "PK_280950d636741f65f3f98968923" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_withdrawal_requests_status_enum" AS ENUM('Pending', 'Approved', 'Rejected', 'Paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "affiliate_withdrawal_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "affiliateId" uuid NOT NULL, "amount" numeric(20,2) NOT NULL, "status" "public"."affiliate_withdrawal_requests_status_enum" NOT NULL DEFAULT 'Pending', "note" character varying, "processedById" uuid, "processedAt" TIMESTAMP, CONSTRAINT "PK_9f1ad896a23aebcd63e6ca38b60" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_training_modules_type_enum" AS ENUM('video', 'article', 'both', 'quiz')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."affiliate_training_modules_status_enum" AS ENUM('Published', 'Draft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "affiliate_training_modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" text NOT NULL, "type" "public"."affiliate_training_modules_type_enum" NOT NULL DEFAULT 'article', "videoUrl" character varying, "articleContent" text, "duration" character varying, "status" "public"."affiliate_training_modules_status_enum" NOT NULL DEFAULT 'Draft', "order" integer NOT NULL DEFAULT '0', "quizData" jsonb, CONSTRAINT "PK_8fa364366e8644cdf44bd84639b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateDirectCommission" numeric(10,2) NOT NULL DEFAULT '20'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateIndirectCommission" numeric(10,2) NOT NULL DEFAULT '5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateCommissionDurationMonths" integer NOT NULL DEFAULT '3'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateMinimumWithdrawal" numeric(10,2) NOT NULL DEFAULT '5000'`,
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
      `ALTER TABLE "training_lessons" ADD CONSTRAINT "FK_208763910a9b8bbff1675b9a2e3" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "FK_304c02a721693cc9b83995a2b17" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "FK_6c3b0e55eef13d32116b4377e2f" FOREIGN KEY ("referralId") REFERENCES "affiliate_referrals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "FK_8e5e15268c3cf8400ad71b644ce" FOREIGN KEY ("referredBusinessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "FK_82d96020b31bc03f7a8b961da6f" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "FK_131f7d6e816eb6431fb220bf461" FOREIGN KEY ("referredBusinessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "FK_c5a12ed95da261311593d0d06f8" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_profiles" ADD CONSTRAINT "FK_83755235707b72b56985c1f9864" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_withdrawal_requests" ADD CONSTRAINT "FK_146df203bd6225b0ef225b63b19" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "affiliate_withdrawal_requests" DROP CONSTRAINT "FK_146df203bd6225b0ef225b63b19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_profiles" DROP CONSTRAINT "FK_83755235707b72b56985c1f9864"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" DROP CONSTRAINT "FK_c5a12ed95da261311593d0d06f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" DROP CONSTRAINT "FK_131f7d6e816eb6431fb220bf461"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_referrals" DROP CONSTRAINT "FK_82d96020b31bc03f7a8b961da6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "FK_8e5e15268c3cf8400ad71b644ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "FK_6c3b0e55eef13d32116b4377e2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "FK_304c02a721693cc9b83995a2b17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_lessons" DROP CONSTRAINT "FK_208763910a9b8bbff1675b9a2e3"`,
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
      `ALTER TABLE "settings" DROP COLUMN "affiliateMinimumWithdrawal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "affiliateCommissionDurationMonths"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "affiliateIndirectCommission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "affiliateDirectCommission"`,
    );
    await queryRunner.query(`DROP TABLE "affiliate_training_modules"`);
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_training_modules_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_training_modules_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "affiliate_withdrawal_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_withdrawal_requests_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "affiliate_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_profiles_kycstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_profiles_tier_enum"`,
    );
    await queryRunner.query(`DROP TABLE "affiliate_referrals"`);
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_referrals_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "affiliate_commissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."affiliate_commissions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "training_lessons"`);
    await queryRunner.query(`DROP TABLE "training_courses"`);
  }
}
