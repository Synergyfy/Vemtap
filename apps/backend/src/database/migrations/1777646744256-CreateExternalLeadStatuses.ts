import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExternalLeadStatuses1777646744256 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'external_lead_statuses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'externalLeadId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['new', 'processing', 'completed', 'cancelled', 'rejected'],
            default: "'new'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'businessId',
            type: 'uuid',
          },
          {
            name: 'branchId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'external_lead_statuses',
      new TableIndex({
        name: 'IDX_EXTERNAL_LEAD_ID',
        columnNames: ['externalLeadId'],
      }),
    );

    await queryRunner.createIndex(
      'external_lead_statuses',
      new TableIndex({
        name: 'IDX_EXTERNAL_LEAD_BUSINESS_ID',
        columnNames: ['businessId'],
      }),
    );

    await queryRunner.createIndex(
      'external_lead_statuses',
      new TableIndex({
        name: 'IDX_EXTERNAL_LEAD_BRANCH_ID',
        columnNames: ['branchId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('external_lead_statuses');
  }
}
