import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogueDealGiftsTable1788300000000
  implements MigrationInterface
{
  name = 'CreateCatalogueDealGiftsTable1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."catalogue_deal_gifts_status_enum" AS ENUM('pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalogue_deal_gifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "offerId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "senderName" character varying NOT NULL,
        "senderEmail" character varying NOT NULL,
        "senderPhone" character varying,
        "recipientEmail" character varying NOT NULL,
        "recipientName" character varying,
        "recipientPhone" character varying,
        "note" text,
        "status" "public"."catalogue_deal_gifts_status_enum" NOT NULL DEFAULT 'pending',
        "token" character varying NOT NULL,
        "rejectionReason" text,
        "acceptedAt" TIMESTAMP,
        "rejectedAt" TIMESTAMP,
        CONSTRAINT "UQ_catalogue_deal_gifts_token" UNIQUE ("token"),
        CONSTRAINT "PK_catalogue_deal_gifts_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_offerId" ON "catalogue_deal_gifts" ("offerId");
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_branchId" ON "catalogue_deal_gifts" ("branchId");
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_businessId" ON "catalogue_deal_gifts" ("businessId");
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_senderId" ON "catalogue_deal_gifts" ("senderId");
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_branch_status" ON "catalogue_deal_gifts" ("branchId", "status");
      CREATE INDEX IF NOT EXISTS "IDX_catalogue_deal_gifts_offer_recipient" ON "catalogue_deal_gifts" ("offerId", "recipientEmail");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "catalogue_deal_gifts"
          ADD CONSTRAINT "FK_catalogue_deal_gifts_offer"
          FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "catalogue_deal_gifts"
          ADD CONSTRAINT "FK_catalogue_deal_gifts_branch"
          FOREIGN KEY ("branchId") REFERENCES "branches"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "catalogue_deal_gifts"
          ADD CONSTRAINT "FK_catalogue_deal_gifts_business"
          FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "catalogue_deal_gifts"
          ADD CONSTRAINT "FK_catalogue_deal_gifts_sender"
          FOREIGN KEY ("senderId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalogue_deal_gifts"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."catalogue_deal_gifts_status_enum"`,
    );
  }
}
