import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAffiliateCommissionConfig1786896000000
  implements MigrationInterface
{
  name = 'AddAffiliateCommissionConfig1786896000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" ALTER COLUMN "paymentId" TYPE character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateFirstPaymentCommission" numeric(10,2) NOT NULL DEFAULT '30'`,
    );

    await queryRunner.query(
      `ALTER TABLE "settings" ADD "affiliateRecurringCommission" numeric(10,2) NOT NULL DEFAULT '10'`,
    );

    await queryRunner.query(
      `CREATE TABLE "business_referral_commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "referringBusinessId" uuid NOT NULL, "referredBusinessId" uuid NOT NULL, "amount" numeric(20,2) NOT NULL, "rate" numeric(10,2) NOT NULL, "isFirstPayment" boolean NOT NULL DEFAULT true, "paymentReference" character varying, CONSTRAINT "PK_bb9d6f7b1e2d4a8c9f0a1b2c3d4" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "business_referral_commissions" ADD CONSTRAINT "FK_business_referral_commissions_referring" FOREIGN KEY ("referringBusinessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "business_referral_commissions" ADD CONSTRAINT "FK_business_referral_commissions_referred" FOREIGN KEY ("referredBusinessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_referral_commissions" DROP CONSTRAINT "FK_business_referral_commissions_referred"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_referral_commissions" DROP CONSTRAINT "FK_business_referral_commissions_referring"`,
    );
    await queryRunner.query(`DROP TABLE "business_referral_commissions"`);
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "affiliateRecurringCommission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "affiliateFirstPaymentCommission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "affiliate_commissions" ALTER COLUMN "paymentId" TYPE uuid USING "paymentId"::uuid`,
    );
  }
}
