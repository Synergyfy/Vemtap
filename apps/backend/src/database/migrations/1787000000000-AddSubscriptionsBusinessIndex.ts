import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionsBusinessIndex1787000000000 implements MigrationInterface {
  name = 'AddSubscriptionsBusinessIndex1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Speeds up the Discovery subscription gate (correlated EXISTS subqueries
    // on subscriptions.businessId + status in the cluster deals feed and the
    // rotator eligible pool) and the common activeSubscription lookup.
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_business" ON "subscriptions" ("businessId", "status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_subscriptions_business"`);
  }
}
