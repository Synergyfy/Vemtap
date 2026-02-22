import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoyaltyProfile } from './loyalty-profile.entity';
import { Reward } from './reward.entity';

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loyaltyProfileId: string;

  @ManyToOne(() => LoyaltyProfile, (profile) => profile.redemptions)
  @JoinColumn({ name: 'loyaltyProfileId' })
  loyaltyProfile: LoyaltyProfile;

  @Column()
  rewardId: string;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;

  @Column()
  redemptionCode: string;

  @Column({ type: 'int' })
  pointsSpent: number;

  @Column({ default: 'pending' }) // pending, verified, expired
  status: string;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
