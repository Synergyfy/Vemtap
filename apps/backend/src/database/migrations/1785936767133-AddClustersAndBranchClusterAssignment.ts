import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClustersAndBranchClusterAssignment1785936767133 implements MigrationInterface {
  name = 'AddClustersAndBranchClusterAssignment1785936767133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clusters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "uniqueCode" character varying NOT NULL, "description" text, "latitude" numeric(10,7), "longitude" numeric(10,7), "location" geography(Point,4326), "radiusMeters" integer NOT NULL DEFAULT '500', "isActive" boolean NOT NULL DEFAULT true, "qrIsActive" boolean NOT NULL DEFAULT true, "createdBy" uuid, "scanCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_56c8e201f375e1e961dcdd6831c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_clusters_unique_code" ON "clusters" ("uniqueCode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clusters_location" ON "clusters" USING GiST ("location") `,
    );
    await queryRunner.query(`ALTER TABLE "branches" ADD "clusterId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "idx_branches_cluster" ON "branches" ("clusterId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "FK_792d18a8b8b45f99bd73de50f10" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_cluster_location()
            RETURNS trigger AS $$
            BEGIN
                IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
                ELSE
                    NEW.location = NULL;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
    await queryRunner.query(`
            CREATE TRIGGER trg_clusters_location
                BEFORE INSERT OR UPDATE OF latitude, longitude ON clusters
                FOR EACH ROW EXECUTE FUNCTION update_cluster_location()
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_clusters_location ON clusters`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_cluster_location()`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP CONSTRAINT "FK_792d18a8b8b45f99bd73de50f10"`,
    );
    await queryRunner.query(`DROP INDEX "idx_branches_cluster"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "clusterId"`);
    await queryRunner.query(`DROP INDEX "idx_clusters_location"`);
    await queryRunner.query(`DROP INDEX "idx_clusters_unique_code"`);
    await queryRunner.query(`DROP TABLE "clusters"`);
  }
}
