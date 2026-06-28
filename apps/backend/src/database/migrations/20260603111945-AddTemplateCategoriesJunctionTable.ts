import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateCategoriesJunctionTable20260603111945 implements MigrationInterface {
  name = 'AddTemplateCategoriesJunctionTable20260603111945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN ALTER TABLE "marketing_templates" DROP CONSTRAINT IF EXISTS "FK_marketing_templates_categoryId"; END IF; END $$;`,
    );

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "marketing_template_categories" (
            "templateId" uuid NOT NULL,
            "categoryId" uuid NOT NULL,
            CONSTRAINT "PK_marketing_template_categories" PRIMARY KEY ("templateId", "categoryId")
        )`);

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN INSERT INTO "marketing_template_categories" ("templateId", "categoryId") SELECT "id", "categoryId" FROM "marketing_templates" WHERE "categoryId" IS NOT NULL; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN ALTER TABLE "marketing_template_categories" ADD CONSTRAINT "FK_mtc_templateId" FOREIGN KEY ("templateId") REFERENCES "marketing_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_categories') THEN ALTER TABLE "marketing_template_categories" ADD CONSTRAINT "FK_mtc_categoryId" FOREIGN KEY ("categoryId") REFERENCES "marketing_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN ALTER TABLE "marketing_templates" DROP COLUMN "categoryId"; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN ALTER TABLE "marketing_templates" ADD "categoryId" uuid; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN UPDATE "marketing_templates" SET "categoryId" = sub."categoryId" FROM (SELECT DISTINCT ON ("templateId") "templateId", "categoryId" FROM "marketing_template_categories") sub WHERE "marketing_templates"."id" = sub."templateId"; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_templates') THEN ALTER TABLE "marketing_templates" ADD CONSTRAINT "FK_marketing_templates_categoryId" FOREIGN KEY ("categoryId") REFERENCES "marketing_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION; END IF; END $$;`,
    );

    await queryRunner.query(
      `ALTER TABLE "marketing_template_categories" DROP CONSTRAINT "FK_mtc_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_template_categories" DROP CONSTRAINT "FK_mtc_templateId"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "marketing_template_categories"`,
    );
  }
}
