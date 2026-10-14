import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Business verification moves from Dojah (stateless) to bytID with stored
 * outcomes.
 *
 * - `verification_checks`: one row per identity (NIN / driver's licence /
 *   voter's card / passport, with a selfie) or business (CAC / unregistered)
 *   attempt — masked ID, the names compared, face-match result, reasons and
 *   any admin review. No photos or full registry records are stored.
 * - `businesses.verificationStatus`: unverified | in_progress | needs_review
 *   | verified | rejected. `isVerified` / `verifiedAt` stay and are kept in
 *   step; existing verified businesses are backfilled as `verified`.
 */
export class BytidVerification1812000000000 implements MigrationInterface {
  name = 'BytidVerification1812000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "businesses"
        ADD COLUMN "verificationStatus" varchar(20) NOT NULL DEFAULT 'unverified'
    `);
    await queryRunner.query(`
      UPDATE "businesses" SET "verificationStatus" = 'verified' WHERE "isVerified" = true
    `);

    await queryRunner.query(`
      CREATE TABLE "verification_checks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "businessId" uuid NOT NULL,
        "userId" uuid,
        "kind" varchar(20) NOT NULL,
        "idType" varchar(30) NOT NULL,
        "idNumberMasked" varchar(40),
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "provider" varchar(30) NOT NULL DEFAULT 'bytid',
        "providerCheckId" varchar(80),
        "reference" varchar(100) NOT NULL,
        "livenessSessionId" varchar(80),
        "nameMatch" jsonb,
        "faceMatch" jsonb,
        "reasons" jsonb,
        "documentUrls" jsonb,
        "note" text,
        "reviewedById" uuid,
        "reviewedAt" timestamp,
        "reviewNote" text,
        CONSTRAINT "PK_verification_checks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_verification_checks_business" FOREIGN KEY ("businessId")
          REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_verification_checks_reference" ON "verification_checks" ("reference")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_verification_checks_business_kind"
      ON "verification_checks" ("businessId", "kind", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_verification_checks_provider_check"
      ON "verification_checks" ("providerCheckId") WHERE "providerCheckId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "verification_checks"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "verificationStatus"`,
    );
  }
}
