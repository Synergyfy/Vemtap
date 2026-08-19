import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmartDealRotator1786724369073 implements MigrationInterface {
    name = 'AddSmartDealRotator1786724369073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rotator_configs_rotationmode_enum" AS ENUM('automatic', 'manual')`);
        await queryRunner.query(`CREATE TYPE "public"."rotator_configs_distribution_enum" AS ENUM('balanced', 'weighted', 'scheduled', 'smart')`);
        await queryRunner.query(`CREATE TYPE "public"."rotator_configs_featuredslotsmode_enum" AS ENUM('automatic', 'manual')`);
        await queryRunner.query(`CREATE TABLE "rotator_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "rotationMode" "public"."rotator_configs_rotationmode_enum" NOT NULL DEFAULT 'automatic', "distribution" "public"."rotator_configs_distribution_enum" NOT NULL DEFAULT 'balanced', "featuredSlotsMode" "public"."rotator_configs_featuredslotsmode_enum" NOT NULL DEFAULT 'automatic', "featuredSlotCount" integer, "windowSeconds" integer NOT NULL DEFAULT '60', "frequencyWindowHours" integer NOT NULL DEFAULT '24', CONSTRAINT "PK_8ae54a2929dcd4793dc4225dfc5" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TYPE "public"."rotator_cluster_configs_rotationmode_enum" AS ENUM('automatic', 'manual')`);
        await queryRunner.query(`CREATE TYPE "public"."rotator_cluster_configs_distribution_enum" AS ENUM('balanced', 'weighted', 'scheduled', 'smart')`);
        await queryRunner.query(`CREATE TYPE "public"."rotator_cluster_configs_featuredslotsmode_enum" AS ENUM('automatic', 'manual')`);
        await queryRunner.query(`CREATE TABLE "rotator_cluster_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clusterId" uuid NOT NULL, "rotationMode" "public"."rotator_cluster_configs_rotationmode_enum", "distribution" "public"."rotator_cluster_configs_distribution_enum", "featuredSlotsMode" "public"."rotator_cluster_configs_featuredslotsmode_enum", "featuredSlotCount" integer, "isOverridden" boolean NOT NULL DEFAULT false, "resetAt" TIMESTAMP, CONSTRAINT "PK_dac000f7021959f58270508a215" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_rotator_cluster_config_cluster" ON "rotator_cluster_configs" ("clusterId") `);

        await queryRunner.query(`CREATE TYPE "public"."rotator_cluster_offers_deliveryoverride_enum" AS ENUM('automatic', 'manual')`);
        await queryRunner.query(`CREATE TABLE "rotator_cluster_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clusterId" uuid NOT NULL, "offerId" uuid NOT NULL, "included" boolean NOT NULL DEFAULT true, "deliveryOverride" "public"."rotator_cluster_offers_deliveryoverride_enum", "weight" numeric(6,2), "setBy" uuid, CONSTRAINT "PK_6cd149afc9c2d0d11fd13ef479a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_rotator_cluster_offers_unique" ON "rotator_cluster_offers" ("clusterId", "offerId") `);
        await queryRunner.query(`CREATE INDEX "idx_rotator_cluster_offers_cluster" ON "rotator_cluster_offers" ("clusterId") `);

        await queryRunner.query(`CREATE TABLE "rotator_deal_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "offerId" uuid NOT NULL, "dayOfWeek" integer, "startTime" character varying(5), "endTime" character varying(5), "startDate" TIMESTAMP, "endDate" TIMESTAMP, CONSTRAINT "PK_65d2b0377b3e4205bc2d715b6a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_rotator_schedule_offer" ON "rotator_deal_schedules" ("offerId") `);

        await queryRunner.query(`CREATE TABLE "rotator_rotation_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clusterId" uuid NOT NULL, "windowId" bigint NOT NULL, "windowStart" TIMESTAMP NOT NULL, "windowEnd" TIMESTAMP NOT NULL, "offerIds" jsonb NOT NULL, "slotCount" integer NOT NULL, CONSTRAINT "PK_7b57ecd2cf6581075ba9f2974ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_rotator_records_cluster_window" ON "rotator_rotation_records" ("clusterId", "windowId") `);

        await queryRunner.query(`CREATE TYPE "public"."rotator_impressions_eventtype_enum" AS ENUM('impression', 'view', 'click')`);
        await queryRunner.query(`CREATE TABLE "rotator_impressions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clusterId" uuid NOT NULL, "offerId" uuid NOT NULL, "windowId" bigint NOT NULL, "eventType" "public"."rotator_impressions_eventtype_enum" NOT NULL, "customerId" uuid, "sessionToken" uuid, CONSTRAINT "PK_a27d83d24d72902d0f1ebd8e5de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_rotator_impressions_cluster_window" ON "rotator_impressions" ("clusterId", "windowId") `);
        await queryRunner.query(`CREATE INDEX "idx_rotator_impressions_offer" ON "rotator_impressions" ("offerId") `);
        await queryRunner.query(`CREATE INDEX "idx_rotator_impressions_customer" ON "rotator_impressions" ("customerId") `);

        await queryRunner.query(`ALTER TABLE "rotator_cluster_configs" ADD CONSTRAINT "FK_ca6c566764f8ad0641ec88b4fe6" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_cluster_offers" ADD CONSTRAINT "FK_ba9d97883ce4070dfd5a00503da" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_cluster_offers" ADD CONSTRAINT "FK_ae918464e9092b98dc51b54e4da" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_deal_schedules" ADD CONSTRAINT "FK_65d88b45e0690cd09fcc2c85560" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_rotation_records" ADD CONSTRAINT "FK_74de7e7a6b0f4f37be611949dbd" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_impressions" ADD CONSTRAINT "FK_430021717f29c34ffc2809547b5" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rotator_impressions" ADD CONSTRAINT "FK_e4d42c3cca9a8a62242dec65d34" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rotator_impressions" DROP CONSTRAINT "FK_e4d42c3cca9a8a62242dec65d34"`);
        await queryRunner.query(`ALTER TABLE "rotator_impressions" DROP CONSTRAINT "FK_430021717f29c34ffc2809547b5"`);
        await queryRunner.query(`ALTER TABLE "rotator_rotation_records" DROP CONSTRAINT "FK_74de7e7a6b0f4f37be611949dbd"`);
        await queryRunner.query(`ALTER TABLE "rotator_deal_schedules" DROP CONSTRAINT "FK_65d88b45e0690cd09fcc2c85560"`);
        await queryRunner.query(`ALTER TABLE "rotator_cluster_offers" DROP CONSTRAINT "FK_ae918464e9092b98dc51b54e4da"`);
        await queryRunner.query(`ALTER TABLE "rotator_cluster_offers" DROP CONSTRAINT "FK_ba9d97883ce4070dfd5a00503da"`);
        await queryRunner.query(`ALTER TABLE "rotator_cluster_configs" DROP CONSTRAINT "FK_ca6c566764f8ad0641ec88b4fe6"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_impressions_customer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_impressions_offer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_impressions_cluster_window"`);
        await queryRunner.query(`DROP TABLE "rotator_impressions"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_impressions_eventtype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_records_cluster_window"`);
        await queryRunner.query(`DROP TABLE "rotator_rotation_records"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_schedule_offer"`);
        await queryRunner.query(`DROP TABLE "rotator_deal_schedules"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_cluster_offers_cluster"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_cluster_offers_unique"`);
        await queryRunner.query(`DROP TABLE "rotator_cluster_offers"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_cluster_offers_deliveryoverride_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rotator_cluster_config_cluster"`);
        await queryRunner.query(`DROP TABLE "rotator_cluster_configs"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_cluster_configs_featuredslotsmode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_cluster_configs_distribution_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_cluster_configs_rotationmode_enum"`);
        await queryRunner.query(`DROP TABLE "rotator_configs"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_configs_featuredslotsmode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_configs_distribution_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rotator_configs_rotationmode_enum"`);
    }
}
