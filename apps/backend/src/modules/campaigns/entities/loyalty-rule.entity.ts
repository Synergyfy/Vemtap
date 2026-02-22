import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('loyalty_rules')
export class LoyaltyRule extends AbstractBaseEntity {
    @ApiProperty({ description: 'Branch ID', example: 'branch_001' })
    @Column()
    branchId: string;

    @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'branchId' })
    branch: Branch;

    @ApiProperty({ description: 'Rule type, e.g spending, visit, hybrid', example: 'hybrid' })
    @Column({ default: 'hybrid' })
    ruleType: string;

    @ApiProperty({ description: 'Is rule active', example: true })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({ description: 'Amount to spend to earn points', example: 10 })
    @Column({ type: 'int', default: 10 })
    spendingBaseAmount: number;

    @ApiProperty({ description: 'Points earned per base spend amount', example: 1 })
    @Column({ type: 'int', default: 1 })
    spendingBasePoints: number;

    @ApiProperty({ description: 'Points earned per visit', example: 50 })
    @Column({ type: 'int', default: 50 })
    visitPoints: number;

    @ApiProperty({ description: 'Hours to wait between visit points', example: 24 })
    @Column({ type: 'int', default: 24 })
    visitCooldownHours: number;

    @ApiProperty({ description: 'First visit bonus points', example: 100 })
    @Column({ type: 'int', default: 100 })
    firstVisitBonus: number;

    @ApiProperty({ description: 'Birthday bonus points', example: 500 })
    @Column({ type: 'int', default: 500 })
    birthdayBonus: number;

    @ApiProperty({ description: 'Referral bonus points', example: 200 })
    @Column({ type: 'int', default: 200 })
    referralBonus: number;
}
