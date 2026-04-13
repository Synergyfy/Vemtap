import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AffiliateProfile } from './affiliate-profile.entity';
import { AffiliateReferral } from './referral.entity';
import { Business } from '../../businesses/entities/business.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CommissionStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  CANCELLED = 'Cancelled',
}

@Entity('affiliate_commissions')
export class AffiliateCommission extends AbstractBaseEntity {
  @ManyToOne(() => AffiliateProfile, (profile) => profile.commissions)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: AffiliateProfile;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  affiliateId: string;

  @ManyToOne(() => AffiliateReferral, (referral) => referral.commissions)
  @JoinColumn({ name: 'referralId' })
  referral: AffiliateReferral;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  referralId: string;

  @ApiProperty({ example: 5000 })
  @Column('decimal', { precision: 20, scale: 2 })
  amount: number;

  @ApiProperty({ enum: CommissionStatus, default: CommissionStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @ApiProperty({ example: 'Subscription fee for Tech Solutions' })
  @Column()
  description: string;

  @ApiProperty({ example: 'uuid-string', description: 'Linked payment ID' })
  @Column({ type: 'uuid', nullable: true })
  paymentId: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'referredBusinessId' })
  referredBusiness: Business;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  referredBusinessId: string;
}
