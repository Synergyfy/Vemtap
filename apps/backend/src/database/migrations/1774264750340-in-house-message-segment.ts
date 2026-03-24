import { MigrationInterface, QueryRunner } from 'typeorm';

export class InHouseMessageSegment1774264750340 implements MigrationInterface {
  name = 'InHouseMessageSegment1774264750340';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "segments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "branchId" uuid NOT NULL, "businessId" uuid NOT NULL, CONSTRAINT "PK_beff1eec19679fe8ad4f291f04e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "segment_users" ("segmentId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_d82e991e7a8f66900c42bf9b1e8" PRIMARY KEY ("segmentId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a31f606b3f98726184a755bc3" ON "segment_users" ("segmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21c14e2ca3526c63bb0c0a14cb" ON "segment_users" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD "segmentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."message_campaigns_audiencetype_enum" RENAME TO "message_campaigns_audiencetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_audiencetype_enum" AS ENUM('ALL', 'GROUP', 'TAGGED', 'RECENT', 'SEGMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ALTER COLUMN "audienceType" TYPE "public"."message_campaigns_audiencetype_enum" USING "audienceType"::"text"::"public"."message_campaigns_audiencetype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_audiencetype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT '0.08'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT '0.01'`,
    );
    await queryRunner.query(
      `ALTER TABLE "segments" ADD CONSTRAINT "FK_6306a92cd35c3b64d1d9b87d76f" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "segments" ADD CONSTRAINT "FK_5d0489b09991f73ba4929eb3823" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "segment_users" ADD CONSTRAINT "FK_4a31f606b3f98726184a755bc31" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "segment_users" ADD CONSTRAINT "FK_21c14e2ca3526c63bb0c0a14cbf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_users" DROP CONSTRAINT "FK_21c14e2ca3526c63bb0c0a14cbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "segment_users" DROP CONSTRAINT "FK_4a31f606b3f98726184a755bc31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "segments" DROP CONSTRAINT "FK_5d0489b09991f73ba4929eb3823"`,
    );
    await queryRunner.query(
      `ALTER TABLE "segments" DROP CONSTRAINT "FK_6306a92cd35c3b64d1d9b87d76f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostEmail" SET DEFAULT 0.01`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostWhatsapp" SET DEFAULT 0.08`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "messagingCostSms" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_audiencetype_enum_old" AS ENUM('ALL', 'GROUP', 'TAGGED', 'RECENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ALTER COLUMN "audienceType" TYPE "public"."message_campaigns_audiencetype_enum_old" USING "audienceType"::"text"::"public"."message_campaigns_audiencetype_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_audiencetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."message_campaigns_audiencetype_enum_old" RENAME TO "message_campaigns_audiencetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP COLUMN "segmentId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21c14e2ca3526c63bb0c0a14cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a31f606b3f98726184a755bc3"`,
    );
    await queryRunner.query(`DROP TABLE "segment_users"`);
    await queryRunner.query(`DROP TABLE "segments"`);
  }
}
