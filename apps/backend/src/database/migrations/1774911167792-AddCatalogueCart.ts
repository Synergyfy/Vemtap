import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogueCart1774911167792 implements MigrationInterface {
    name = 'AddCatalogueCart1774911167792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "catalogue_cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "cartId" uuid NOT NULL, "itemId" uuid, "offerId" uuid, "quantity" integer NOT NULL DEFAULT '1', "snapshotPrice" numeric(12,2) NOT NULL, "snapshotName" character varying(255) NOT NULL, "snapshotImage" character varying(500), CONSTRAINT "PK_e69108642cda94232c4832e989c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "catalogue_carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "customerId" uuid NOT NULL, "branchId" uuid NOT NULL, "businessId" uuid NOT NULL, CONSTRAINT "PK_481cdfb772a155d8bbd191d68c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f955b710a8619c0d902fecaf8c" ON "catalogue_carts" ("customerId", "branchId") `);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" ADD CONSTRAINT "FK_179e1a7625fa2b1f7737ae52916" FOREIGN KEY ("cartId") REFERENCES "catalogue_carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" ADD CONSTRAINT "FK_64eb2fb867c31470f43c0f21690" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" ADD CONSTRAINT "FK_07a71f06ce9acb72eda29d887d5" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogue_carts" ADD CONSTRAINT "FK_cc518e52617c6f758481225dbc7" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogue_carts" ADD CONSTRAINT "FK_306093416a27c3b5e57f42b4b77" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogue_carts" ADD CONSTRAINT "FK_7a4a97bb09a2a20b59fa9a4b8cc" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_carts" DROP CONSTRAINT "FK_7a4a97bb09a2a20b59fa9a4b8cc"`);
        await queryRunner.query(`ALTER TABLE "catalogue_carts" DROP CONSTRAINT "FK_306093416a27c3b5e57f42b4b77"`);
        await queryRunner.query(`ALTER TABLE "catalogue_carts" DROP CONSTRAINT "FK_cc518e52617c6f758481225dbc7"`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" DROP CONSTRAINT "FK_07a71f06ce9acb72eda29d887d5"`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" DROP CONSTRAINT "FK_64eb2fb867c31470f43c0f21690"`);
        await queryRunner.query(`ALTER TABLE "catalogue_cart_items" DROP CONSTRAINT "FK_179e1a7625fa2b1f7737ae52916"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f955b710a8619c0d902fecaf8c"`);
        await queryRunner.query(`DROP TABLE "catalogue_carts"`);
        await queryRunner.query(`DROP TABLE "catalogue_cart_items"`);
    }

}
