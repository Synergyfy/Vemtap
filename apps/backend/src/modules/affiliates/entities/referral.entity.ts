import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AffiliateProfile } from './affiliate-profile.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { AffiliateCommission } from './commission.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ReferralStatus {
  PENDING = 'Pending',
  CONVERTED = 'Converted',
  EXPIRED = 'Expired',
}

@Entity('affiliate_referrals')
export class AffiliateReferral extends AbstractBaseEntity {
  @ManyToOne(() => AffiliateProfile, (profile) => profile.referrals)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: AffiliateProfile;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  affiliateId: string;

  // The business that was referred
  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'referredBusinessId' })
  referredBusiness: Business;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  referredBusinessId: string;

  // The user that was referred (could be a customer or another agent)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referredUserId' })
  referredUser: User;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  referredUserId: string;

  @ApiProperty({ enum: ReferralStatus, default: ReferralStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date;

  @OneToMany(() => AffiliateCommission, (commission) => commission.referral)
  commissions: AffiliateCommission[];
}
