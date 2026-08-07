import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClusterHierarchyAndClusterOffers1786015202869 implements MigrationInterface {
  name = 'AddClusterHierarchyAndClusterOffers1786015202869';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cluster_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clusterId" uuid NOT NULL, "offerId" uuid NOT NULL, "isPinned" boolean NOT NULL DEFAULT true, "pinnedBy" uuid, "pinnedAt" TIMESTAMP, CONSTRAINT "PK_3f5951a57fcc8d096205be855dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_cluster_offers_unique" ON "cluster_offers" ("clusterId", "offerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cluster_offers_cluster" ON "cluster_offers" ("clusterId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clusters_type_enum" AS ENUM('country', 'state', 'market', 'building', 'custom')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD "type" "public"."clusters_type_enum" NOT NULL DEFAULT 'market'`,
    );
    await queryRunner.query(`ALTER TABLE "clusters" ADD "parentId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD "country" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD "state" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD "city" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD "area" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clusters_type" ON "clusters" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clusters_parent" ON "clusters" ("parentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" ADD CONSTRAINT "FK_d7c37675469a2b8bbbe44249851" FOREIGN KEY ("parentId") REFERENCES "clusters"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cluster_offers" ADD CONSTRAINT "FK_fce623eba89492580b410e1b513" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cluster_offers" ADD CONSTRAINT "FK_4ed2bfb09e8aef7b8b0e898299a" FOREIGN KEY ("offerId") REFERENCES "catalogue_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cluster_offers" DROP CONSTRAINT "FK_4ed2bfb09e8aef7b8b0e898299a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cluster_offers" DROP CONSTRAINT "FK_fce623eba89492580b410e1b513"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clusters" DROP CONSTRAINT "FK_d7c37675469a2b8bbbe44249851"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_clusters_parent"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clusters_type"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "area"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "state"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "parentId"`);
    await queryRunner.query(`ALTER TABLE "clusters" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."clusters_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_cluster_offers_cluster"`);
    await queryRunner.query(`DROP INDEX "public"."idx_cluster_offers_unique"`);
    await queryRunner.query(`DROP TABLE "cluster_offers"`);
  }
}
