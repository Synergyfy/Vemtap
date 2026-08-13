import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgeBaseTables1785620000000 implements MigrationInterface {
  name = 'CreateKnowledgeBaseTables1785620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "title" character varying NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_kb_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "title" character varying NOT NULL,
        "categoryId" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_kb_sections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kb_sections_category" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "title" character varying NOT NULL,
        "path" character varying NOT NULL,
        "summary" text NOT NULL,
        "thumbnail" character varying,
        "blocks" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "tips" jsonb,
        "categoryId" uuid NOT NULL,
        "sectionId" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_kb_pages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_kb_pages_path" UNIQUE ("path"),
        CONSTRAINT "FK_kb_pages_category" FOREIGN KEY ("categoryId") REFERENCES "kb_categories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_kb_pages_section" FOREIGN KEY ("sectionId") REFERENCES "kb_sections"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kb_pages_path" ON "kb_pages" ("path")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_kb_pages_path"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_pages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_categories"`);
  }
}
