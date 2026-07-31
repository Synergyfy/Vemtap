import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiToCreditTransactionsChannelEnum20260731144500
  implements MigrationInterface
{
  name = 'AddAiToCreditTransactionsChannelEnum20260731144500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."credit_transactions_channel_enum" ADD VALUE IF NOT EXISTS 'AI'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values cannot be removed easily in PostgreSQL without recreating the enum type
  }
}
