import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogueOfferClaims1782811149117 implements MigrationInterface {
    name = 'AddCatalogueOfferClaims1782811149117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."catalogue_offer_claims_status_enum" AS ENUM('claimed', 'redeemed', 'expired')`);
        await queryRunner.query(`CREATE TABLE "catalogue_offer_claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying, "email" character varying NOT NULL, "phone" character varying NOT NULL, "claimCode" character varying NOT NULL, "status" "public"."catalogue_offer_claims_status_enum" NOT NULL DEFAULT 'claimed', "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_319acd522453fc9e63874e58bbf" UNIQUE ("claimCode"), CONSTRAINT "PK_e5724b3f1e4684946f1247bd73a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_319acd522453fc9e63874e58bb" ON "catalogue_offer_claims" ("claimCode") `);
        await queryRunner.query(`ALTER TABLE "catalogue_offer_claims" ADD CONSTRAINT "FK_0c10903f0884e2c34ad8c252602" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_offer_claims" DROP CONSTRAINT "FK_0c10903f0884e2c34ad8c252602"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_319acd522453fc9e63874e58bb"`);
        await queryRunner.query(`DROP TABLE "catalogue_offer_claims"`);
        await queryRunner.query(`DROP TYPE "public"."catalogue_offer_claims_status_enum"`);
    }

}
