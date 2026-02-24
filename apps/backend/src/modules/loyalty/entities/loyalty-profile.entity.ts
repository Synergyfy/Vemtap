import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { Redemption } from './redemption.entity';

export enum TierLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('loyalty_profiles')
export class LoyaltyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'int', default: 0 })
  totalPointsEarned: number;

  @Column({ type: 'int', default: 0 })
  currentPointsBalance: number;

  @Column({ type: 'int', default: 0 })
  pointsRedeemed: number;

  @Column({
    type: 'enum',
    enum: TierLevel,
    default: TierLevel.BRONZE,
  })
  tierLevel: TierLevel;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVisitDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastRewardedAt: Date;

  @OneToMany(
    () => LoyaltyTransaction,
    (transaction) => transaction.loyaltyProfile,
  )
  transactions: LoyaltyTransaction[];

  @OneToMany(() => Redemption, (redemption) => redemption.loyaltyProfile)
  redemptions: Redemption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
