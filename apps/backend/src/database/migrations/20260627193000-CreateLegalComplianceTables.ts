import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegalComplianceTables20260627193000 implements MigrationInterface {
  name = 'CreateLegalComplianceTables20260627193000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "legal_agreements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "version" character varying(50) NOT NULL,
        "contentUrl" text,
        "effectiveDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_legal_agreements_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_legal_agreements" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "legal_agreement_acceptances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "agreementId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "version" character varying(50) NOT NULL,
        "ipAddress" character varying(45),
        "userAgent" text,
        "acceptedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "signatureHash" character varying,
        CONSTRAINT "PK_legal_agreement_acceptances" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legal_agreement_acceptances_agreement" ON "legal_agreement_acceptances" ("agreementId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legal_agreement_acceptances_user" ON "legal_agreement_acceptances" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_legal_agreement_acceptances_agreement" FOREIGN KEY ("agreementId") REFERENCES "legal_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" ADD CONSTRAINT "FK_legal_agreement_acceptances_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_legal_agreement_acceptances_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legal_agreement_acceptances" DROP CONSTRAINT "FK_legal_agreement_acceptances_agreement"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legal_agreement_acceptances_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legal_agreement_acceptances_agreement"`,
    );
    await queryRunner.query(`DROP TABLE "legal_agreement_acceptances"`);
    await queryRunner.query(`DROP TABLE "legal_agreements"`);
  }
}
