import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('loyalty_profiles')
export class LoyaltyProfile extends AbstractBaseEntity {
    @ApiProperty({ description: 'The user ID', example: 'user_001' })
    @Column()
    @Index()
    userId: string;

    @ApiProperty({ description: 'The business ID', example: 'business_001' })
    @Column()
    @Index()
    businessId: string;

    @ApiProperty({ description: 'Total points earned over lifetime', example: 5000 })
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

    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
