import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { LoyaltyProfile } from './loyalty-profile.entity';
import { Reward } from './reward.entity';

@Entity('redemptions')
export class Redemption extends AbstractBaseEntity {
  @ApiProperty({ description: 'Loyalty profile ID' })
  @Column()
  loyaltyProfileId: string;

  @ApiProperty({ description: 'Reward ID' })
  @Column()
  rewardId: string;

  @ApiProperty({
    description: 'Unique code to verify redemption',
    example: 'A1B2C3D4',
  })
  @Column({ unique: true })
  redemptionCode: string;

  @ApiProperty({ description: 'Points spent on this redemption', example: 500 })
  @Column({ type: 'int' })
  pointsSpent: number;

  @ApiProperty({
    description: 'Status: pending, verified, used, expired',
    example: 'pending',
  })
  @Column({ default: 'pending' })
  status: string;

  @ApiProperty({ description: 'Date redeemed' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  redeemedAt: Date;

  @ApiProperty({ description: 'Date verified' })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ApiProperty({ description: 'ID of user who verified' })
  @Column({ nullable: true })
  verifiedByUserId: string;

  @ApiProperty({ description: 'Expiry Date' })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => LoyaltyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyProfileId' })
  loyaltyProfile: LoyaltyProfile;

  @ManyToOne(() => Reward, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;
}
