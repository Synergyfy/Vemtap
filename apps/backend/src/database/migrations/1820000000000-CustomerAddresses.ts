import { MigrationInterface, QueryRunner } from 'typeorm';

/** Customer saved addresses (Home, Office, …), one default per customer. */
export class CustomerAddresses1820000000000 implements MigrationInterface {
  name = 'CustomerAddresses1820000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "customer_addresses" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
         "deletedAt" TIMESTAMP,
         "userId" uuid NOT NULL,
         "label" character varying(40) NOT NULL,
         "line" character varying(200) NOT NULL,
         "area" character varying(120),
         "notes" character varying(300),
         "latitude" numeric(10,7),
         "longitude" numeric(10,7),
         "isDefault" boolean NOT NULL DEFAULT false,
         CONSTRAINT "PK_customer_addresses" PRIMARY KEY ("id"),
         CONSTRAINT "FK_customer_addresses_user" FOREIGN KEY ("userId")
           REFERENCES "users"("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_user" ON "customer_addresses" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_addresses"`);
  }
}
