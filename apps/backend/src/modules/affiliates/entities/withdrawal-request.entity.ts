import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AffiliateProfile } from './affiliate-profile.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum WithdrawalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid',
}

@Entity('affiliate_withdrawal_requests')
export class AffiliateWithdrawalRequest extends AbstractBaseEntity {
  @ManyToOne(() => AffiliateProfile, (profile) => profile.withdrawalRequests)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: AffiliateProfile;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  affiliateId: string;

  @ApiProperty({ example: 10000 })
  @Column('decimal', { precision: 20, scale: 2 })
  amount: number;

  @ApiProperty({ enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @ApiProperty({ example: 'Bank transfer', nullable: true })
  @Column({ nullable: true })
  note: string;

  @ApiProperty({ example: 'uuid-string', description: 'Admin who processed the request', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  processedById: string;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
