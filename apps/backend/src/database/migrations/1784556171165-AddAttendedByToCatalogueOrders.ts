import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttendedByToCatalogueOrders1784556171165 implements MigrationInterface {
    name = 'AddAttendedByToCatalogueOrders1784556171165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_orders" ADD "attendedById" uuid`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" ADD CONSTRAINT "FK_0354df3f5ea5dacfdda1f5b9024" FOREIGN KEY ("attendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogue_orders" DROP CONSTRAINT "FK_0354df3f5ea5dacfdda1f5b9024"`);
        await queryRunner.query(`ALTER TABLE "catalogue_orders" DROP COLUMN "attendedById"`);
    }

}
