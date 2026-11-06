import { MigrationInterface, QueryRunner } from 'typeorm';

const BASE_COLUMNS = `
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP`;

/**
 * POS tills, staff passcodes, supervisor override audit and configured
 * peripherals, plus the till a register session runs on.
 */
export class PosTillsPinsPeripherals1817000000000 implements MigrationInterface {
  name = 'PosTillsPinsPeripherals1817000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_tills" (${BASE_COLUMNS},
        "businessId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "name" varchar(60) NOT NULL,
        "code" varchar(24) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'idle',
        "deviceLabel" varchar(120),
        "lastSeenAt" TIMESTAMP,
        CONSTRAINT "PK_pos_tills" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_tills_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pos_tills_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_tills_business_branch" ON "pos_tills" ("businessId", "branchId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pos_tills_business_code" ON "pos_tills" ("businessId", "code") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "pos_register_sessions" ADD COLUMN IF NOT EXISTS "tillId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_register_sessions" ADD CONSTRAINT "FK_pos_register_sessions_till" FOREIGN KEY ("tillId") REFERENCES "pos_tills"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_register_sessions_till_status" ON "pos_register_sessions" ("tillId", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_staff_pins" (${BASE_COLUMNS},
        "businessId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "pinHash" varchar(100) NOT NULL,
        "isSupervisor" boolean NOT NULL DEFAULT false,
        "failedAttempts" integer NOT NULL DEFAULT 0,
        "lockedUntil" TIMESTAMP,
        CONSTRAINT "PK_pos_staff_pins" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_staff_pins_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pos_staff_pins_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pos_staff_pins_business_user" ON "pos_staff_pins" ("businessId", "userId") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_override_logs" (${BASE_COLUMNS},
        "businessId" uuid NOT NULL,
        "branchId" uuid,
        "action" varchar(24) NOT NULL,
        "supervisorId" uuid NOT NULL,
        "requestedById" uuid NOT NULL,
        "referenceId" uuid,
        "reason" varchar(200),
        CONSTRAINT "PK_pos_override_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_override_logs_supervisor" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pos_override_logs_requested_by" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_override_logs_business_time" ON "pos_override_logs" ("businessId", "createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_peripherals" (${BASE_COLUMNS},
        "businessId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "tillId" uuid,
        "type" varchar(24) NOT NULL,
        "name" varchar(60) NOT NULL,
        "model" varchar(60),
        "connection" varchar(16) NOT NULL,
        "address" varchar(120),
        "status" varchar(16) NOT NULL DEFAULT 'disconnected',
        "lastSeenAt" TIMESTAMP,
        CONSTRAINT "PK_pos_peripherals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_peripherals_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pos_peripherals_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pos_peripherals_till" FOREIGN KEY ("tillId") REFERENCES "pos_tills"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pos_peripherals_business_branch" ON "pos_peripherals" ("businessId", "branchId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_peripherals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_override_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_staff_pins"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pos_register_sessions_till_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_register_sessions" DROP CONSTRAINT IF EXISTS "FK_pos_register_sessions_till"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_register_sessions" DROP COLUMN IF EXISTS "tillId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_tills"`);
  }
}
