import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Prepaid naira wallet for paid promotion (boosts and promotion campaigns),
 * separate from the messaging credit wallet which counts message units.
 *
 * `ad_wallets` holds one balance per business (`reserved` = held for running
 * campaigns); `ad_wallet_transactions` is the append-only ledger, where a
 * unique `reference` makes each paid top-up creditable only once. Top-ups are
 * paid through Paystack under the new 'Ad Wallet Topup' payment purpose.
 */
export class AdWallet1809000000000 implements MigrationInterface {
  name = 'AdWallet1809000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "payments_purpose_enum" ADD VALUE IF NOT EXISTS 'Ad Wallet Topup'
    `);

    await queryRunner.query(`
      CREATE TABLE "ad_wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "businessId" uuid NOT NULL,
        "walletRef" varchar(32) NOT NULL,
        "balance" numeric(14,2) NOT NULL DEFAULT 0,
        "reserved" numeric(14,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_ad_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ad_wallets_businessId" UNIQUE ("businessId"),
        CONSTRAINT "UQ_ad_wallets_walletRef" UNIQUE ("walletRef"),
        CONSTRAINT "CHK_ad_wallets_amounts" CHECK ("balance" >= 0 AND "reserved" >= 0 AND "reserved" <= "balance"),
        CONSTRAINT "FK_ad_wallets_business" FOREIGN KEY ("businessId")
          REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ad_wallet_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "walletId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "amount" numeric(14,2) NOT NULL DEFAULT 0,
        "reference" varchar(120),
        "campaignId" uuid,
        "description" varchar(200) NOT NULL,
        "balanceAfter" numeric(14,2) NOT NULL DEFAULT 0,
        "reservedAfter" numeric(14,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_ad_wallet_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ad_wallet_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "FK_ad_wallet_transactions_wallet" FOREIGN KEY ("walletId")
          REFERENCES "ad_wallets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ad_wallet_transactions_wallet_created"
      ON "ad_wallet_transactions" ("walletId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ad_wallet_transactions_campaign"
      ON "ad_wallet_transactions" ("campaignId") WHERE "campaignId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ad_wallet_transactions"`);
    await queryRunner.query(`DROP TABLE "ad_wallets"`);
    // 'Ad Wallet Topup' stays in payments_purpose_enum: Postgres cannot drop
    // enum values, and existing payment rows may reference it.
  }
}
