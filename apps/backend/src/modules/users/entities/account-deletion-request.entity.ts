import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum AccountDeletionStatus {
  COMPLETED = 'completed',
}

/**
 * Audit row for a self-service account deletion. The user row itself is
 * anonymised and soft-deleted, so this keeps the who/when/why without PII.
 */
@Entity('account_deletion_requests')
export class AccountDeletionRequest extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Customer' })
  @Column()
  role: string;

  @ApiProperty({ example: 'no-longer-use', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  reasonId: string | null;

  @ApiProperty({ example: 'I moved to another city.', nullable: true })
  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @ApiProperty({ enum: AccountDeletionStatus })
  @Column({ type: 'varchar', default: AccountDeletionStatus.COMPLETED })
  status: AccountDeletionStatus;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  @Column({ type: 'timestamp' })
  completedAt: Date;
}
