import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingsAndThreadSubjects1791495822938 implements MigrationInterface {
  name = 'AddBookingsAndThreadSubjects1791495822938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('booked', 'confirmed', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "customerId" uuid NOT NULL, "businessId" uuid NOT NULL, "branchId" uuid NOT NULL, "itemId" uuid, "itemName" character varying NOT NULL, "date" date NOT NULL, "time" character varying(5) NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '60', "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'booked', "reference" character varying NOT NULL, "notes" text, "cancelledAt" TIMESTAMP, "cancellationReason" text, CONSTRAINT "UQ_d7eca65f0a4d442ec4491f2f804" UNIQUE ("reference"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70bda363f5aa76c8f3ea7a96cd" ON "bookings" ("branchId", "date", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_threads_subjecttype_enum" AS ENUM('GENERAL', 'DEAL', 'CLAIM', 'ORDER', 'BOOKING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "subjectType" "public"."conversation_threads_subjecttype_enum" NOT NULL DEFAULT 'GENERAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "claimId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD "orderId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_67b9cd20f987fc6dc70f7cd283f" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bbf7fb08b638ef9eed30906515e" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_64de318a01c502530b1e32692fd" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_9eacca30361cd0f4f322a022f54" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_9eacca30361cd0f4f322a022f54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_64de318a01c502530b1e32692fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bbf7fb08b638ef9eed30906515e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_67b9cd20f987fc6dc70f7cd283f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "orderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "claimId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP COLUMN "subjectType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."conversation_threads_subjecttype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70bda363f5aa76c8f3ea7a96cd"`,
    );
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
  }
}
