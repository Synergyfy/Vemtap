import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AffiliateReferral } from './referral.entity';
import { AffiliateCommission } from './commission.entity';
import { AffiliateWithdrawalRequest } from './withdrawal-request.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum AffiliateTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
}

export enum KycStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
}

@Entity('affiliate_profiles')
export class AffiliateProfile extends AbstractBaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'VEM-ABC-123' })
  @Column({ unique: true })
  referralCode: string;

  @ApiProperty({ example: 0 })
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  totalEarnings: number;

  @ApiProperty({ example: 0 })
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  availableBalance: number;

  @ApiProperty({ example: 0 })
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  withdrawalsCount: number;

  @ApiProperty({ enum: AffiliateTier, default: AffiliateTier.BRONZE })
  @Column({
    type: 'simple-enum',
    enum: AffiliateTier,
    default: AffiliateTier.BRONZE,
  })
  tier: AffiliateTier;

  @ApiProperty({ enum: KycStatus, default: KycStatus.UNVERIFIED })
  @Column({
    type: 'simple-enum',
    enum: KycStatus,
    default: KycStatus.UNVERIFIED,
  })
  kycStatus: KycStatus;

  @ApiProperty({ example: 'NIN', nullable: true })
  @Column({ nullable: true })
  idType: string;

  @ApiProperty({ example: '12345678901', nullable: true })
  @Column({ nullable: true })
  idNumber: string;

  @ApiProperty({ example: 'https://cdn.example.com/id.png', nullable: true })
  @Column({ nullable: true })
  idImageUrl: string;

  @ApiProperty({ example: { bank: 'GTBank', account: '0123456789' } })
  @Column({ type: 'jsonb', nullable: true })
  bankAccountDetails: any;

  @ApiProperty({ example: ['uuid-1', 'uuid-2'], description: 'Completed training module/lesson IDs' })
  @Column({ type: 'text', array: true, default: '{}' })
  completedModules: string[];

  @ApiProperty({ example: 85, description: 'Highest training quiz score' })
  @Column({ type: 'integer', default: 0 })
  trainingScore: number;

  @OneToMany(() => AffiliateReferral, (referral) => referral.affiliate)
  referrals: AffiliateReferral[];

  @OneToMany(() => AffiliateCommission, (commission) => commission.affiliate)
  commissions: AffiliateCommission[];

  @OneToMany(() => AffiliateWithdrawalRequest, (request) => request.affiliate)
  withdrawalRequests: AffiliateWithdrawalRequest[];

  @ApiProperty({ example: false })
  @Column({ default: false })
  isFlagged: boolean;

  @ApiProperty({ example: 'Suspicious referral pattern', nullable: true })
  @Column({ nullable: true })
  fraudReason: string;
}
