import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogueOfferDeliveryAndLongDesc1785500000000
  implements MigrationInterface
{
  name = 'AddCatalogueOfferDeliveryAndLongDesc1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "deliveryScope" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "deliveryRadius" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "deliveryUnit" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "deliveryRegion" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "minOrderAmount" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" ADD COLUMN IF NOT EXISTS "longDescription" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "longDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "minOrderAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "deliveryRegion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "deliveryUnit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "deliveryRadius"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogue_offers" DROP COLUMN "deliveryScope"`,
    );
  }
}
