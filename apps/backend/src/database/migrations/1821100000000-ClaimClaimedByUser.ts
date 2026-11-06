import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The signed-in customer who made a claim for someone else, so it can stay
 * visible to them as "claimed for ..." while the recipient holds the voucher.
 */
export class ClaimClaimedByUser1821100000000 implements MigrationInterface {
  name = 'ClaimClaimedByUser1821100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" ADD COLUMN IF NOT EXISTS "claimedByUserId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_claims_claimed_by" ON "catalogue_offer_claims" ("claimedByUserId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_offer_claims_claimed_by"`);
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" DROP COLUMN IF EXISTS "claimedByUserId"`,
    );
  }
}
