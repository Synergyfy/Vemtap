import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogueOfferClaimsIndexes1788200000000
  implements MigrationInterface
{
  name = 'AddCatalogueOfferClaimsIndexes1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_offer_claims_offerId" ON "catalogue_offer_claims" ("offerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_offer_claims_offer_status" ON "catalogue_offer_claims" ("offerId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalogue_offer_claims_offer_email" ON "catalogue_offer_claims" ("offerId", "email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_catalogue_offer_claims_offer_email"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_catalogue_offer_claims_offer_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_catalogue_offer_claims_offerId"`,
    );
  }
}
