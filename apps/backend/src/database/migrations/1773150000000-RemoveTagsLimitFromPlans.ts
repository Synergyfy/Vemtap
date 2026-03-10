import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTagsLimitFromPlans1773150000000 implements MigrationInterface {
    name = 'RemoveTagsLimitFromPlans1773150000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "tagsLimit"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ADD "tagsLimit" integer`);
    }
}
