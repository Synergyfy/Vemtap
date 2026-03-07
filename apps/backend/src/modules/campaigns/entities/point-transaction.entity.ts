import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { LoyaltyProfile } from './loyalty-profile.entity';

@Entity('point_transactions')
export class PointTransaction extends AbstractBaseEntity {
  @ApiProperty({ description: 'The profile ID' })
  @Column()
  loyaltyProfileId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @ApiProperty({
    description: 'earn, redeem, bonus, adjustment',
    example: 'earn',
  })
  @Column()
  transactionType: string;

  @ApiProperty({ description: 'Amount of points', example: 100 })
  @Column({ type: 'int' })
  pointsAmount: number;

  @ApiProperty({ description: 'Amount of points', example: 100 })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({
    description: 'Reason for transaction',
    example: 'Visit + Purchase',
  })
  @Column()
  reason: string;

  @ApiProperty({ description: 'External reference ID' })
  @Column({ nullable: true })
  referenceId: string;

  @ApiProperty({ description: 'Transaction metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ApiProperty({ description: 'Expiry date' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @ManyToOne(() => LoyaltyProfile, (profile) => profile.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'loyaltyProfileId' })
  loyaltyProfile: LoyaltyProfile;
}
