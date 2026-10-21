import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The cluster system from the business side: clusters a business proposes
 * (kind, address, who proposed), when a branch joined and what it features,
 * per-item show/hide in the cluster, and member-to-member messages.
 */
export class BusinessClusters1820400000000 implements MigrationInterface {
  name = 'BusinessClusters1820400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clusters"
        ADD COLUMN IF NOT EXISTS "proposedByBusinessId" uuid,
        ADD COLUMN IF NOT EXISTS "kind" character varying(30),
        ADD COLUMN IF NOT EXISTS "address" character varying(255)`);
    await queryRunner.query(`
      ALTER TABLE "branches"
        ADD COLUMN IF NOT EXISTS "clusterJoinedAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "clusterShowcase" character varying(20) NOT NULL DEFAULT 'all'`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cluster_showcase_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "branchId" uuid NOT NULL,
        "entityType" character varying(10) NOT NULL,
        "entityId" uuid NOT NULL,
        "show" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_cluster_showcase_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cluster_showcase_items_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cluster_showcase_item" ON "cluster_showcase_items" ("branchId", "entityType", "entityId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cluster_showcase_items_hidden_deals" ON "cluster_showcase_items" ("entityId") WHERE "entityType" = 'deal' AND "show" = false`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cluster_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "clusterId" uuid NOT NULL,
        "fromBranchId" uuid NOT NULL,
        "toBranchId" uuid NOT NULL,
        "senderUserId" uuid NOT NULL,
        "body" text NOT NULL,
        "readAt" TIMESTAMP,
        CONSTRAINT "PK_cluster_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cluster_messages_cluster" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cluster_messages_from" FOREIGN KEY ("fromBranchId") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cluster_messages_to" FOREIGN KEY ("toBranchId") REFERENCES "branches"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cluster_messages_pair" ON "cluster_messages" ("clusterId", "fromBranchId", "toBranchId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cluster_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cluster_showcase_items"`);
    await queryRunner.query(`
      ALTER TABLE "branches"
        DROP COLUMN IF EXISTS "clusterShowcase",
        DROP COLUMN IF EXISTS "clusterJoinedAt"`);
    await queryRunner.query(`
      ALTER TABLE "clusters"
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "kind",
        DROP COLUMN IF EXISTS "proposedByBusinessId"`);
  }
}
