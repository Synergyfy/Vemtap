import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { PointTransaction } from './point-transaction.entity';
import { Redemption } from './redemption.entity';

export enum TierLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('loyalty_profiles')
export class LoyaltyProfile extends AbstractBaseEntity {
  @ApiProperty({ description: 'The user ID', example: 'user_001' })
  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'The branch ID', example: 'branch_001' })
  @Column({ type: 'uuid', nullable: true })
  @Index()
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ description: 'Current available points', example: 1250 })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({
    description: 'Total points earned over lifetime',
    example: 5000,
  })
  @Column({ type: 'int', default: 0 })
  totalPointsEarned: number;

  @ApiProperty({ description: 'Current available points', example: 1250 })
  @Column({ type: 'int', default: 0 })
  currentPointsBalance: number;

  @ApiProperty({ description: 'Total points redeemed', example: 3750 })
  @Column({ type: 'int', default: 0 })
  pointsRedeemed: number;

  @ApiProperty({ description: 'Tier level of the user', example: 'platinum' })
  @Column({ default: 'bronze' })
  tierLevel: string;

  @ApiProperty({ description: 'Date of last visit' })
  @Column({ type: 'timestamp', nullable: true })
  lastVisitDate: Date;

  @ApiProperty({ description: 'Date when user was last rewarded' })
  @Column({ type: 'timestamp', nullable: true })
  lastRewardedAt: Date;

  @OneToMany(
    () => PointTransaction,
    (transaction) => transaction.loyaltyProfile,
  )
  transactions: PointTransaction[];

  @OneToMany(() => Redemption, (redemption) => redemption.loyaltyProfile)
  redemptions: Redemption[];
}
