import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSavedHubAndClaimUser1791487085561 implements MigrationInterface {
  name = 'AddSavedHubAndClaimUser1791487085561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "saved_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "itemId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_f4d7d4e26d178d805f7c6697a6d" UNIQUE ("itemId", "userId"), CONSTRAINT "PK_4d739bf653b365401f7cf2debec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f51ad05deb10434be1299ff96" ON "saved_services" ("itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11165630b7845c6ff7cafd1d2c" ON "saved_services" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "saved_businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_8d7bc61d08f39f5cd80dea3114d" UNIQUE ("businessId", "userId"), CONSTRAINT "PK_f87c08b767a87cc985d2947ebd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b17c2c017c7f0f5be35c645028" ON "saved_businesses" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c290fa0e4412e9e357c35caea" ON "saved_businesses" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" ADD "userId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca2a847c6079f2e6f47513d83c" ON "catalogue_offer_claims" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_services" ADD CONSTRAINT "FK_0f51ad05deb10434be1299ff969" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_services" ADD CONSTRAINT "FK_11165630b7845c6ff7cafd1d2c2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_businesses" ADD CONSTRAINT "FK_b17c2c017c7f0f5be35c645028d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_businesses" ADD CONSTRAINT "FK_7c290fa0e4412e9e357c35caea2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" ADD CONSTRAINT "FK_ca2a847c6079f2e6f47513d83c4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" DROP CONSTRAINT "FK_ca2a847c6079f2e6f47513d83c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_businesses" DROP CONSTRAINT "FK_7c290fa0e4412e9e357c35caea2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_businesses" DROP CONSTRAINT "FK_b17c2c017c7f0f5be35c645028d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_services" DROP CONSTRAINT "FK_11165630b7845c6ff7cafd1d2c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_services" DROP CONSTRAINT "FK_0f51ad05deb10434be1299ff969"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca2a847c6079f2e6f47513d83c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offer_claims" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c290fa0e4412e9e357c35caea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b17c2c017c7f0f5be35c645028"`,
    );
    await queryRunner.query(`DROP TABLE "saved_businesses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11165630b7845c6ff7cafd1d2c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f51ad05deb10434be1299ff96"`,
    );
    await queryRunner.query(`DROP TABLE "saved_services"`);
  }
}
