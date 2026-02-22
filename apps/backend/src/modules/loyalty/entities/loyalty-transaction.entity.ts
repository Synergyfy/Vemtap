import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoyaltyProfile } from './loyalty-profile.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loyaltyProfileId: string;

  @ManyToOne(() => LoyaltyProfile, (profile) => profile.transactions)
  @JoinColumn({ name: 'loyaltyProfileId' })
  loyaltyProfile: LoyaltyProfile;

  @Column()
  transactionType: string; // 'earn', 'redeem'

  @Column({ type: 'int' })
  pointsAmount: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  referenceId: string; // Can link to redemption ID or order ID

  @CreateDateColumn()
  createdAt: Date;
}
