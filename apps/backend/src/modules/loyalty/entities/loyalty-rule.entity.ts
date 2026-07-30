import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RuleType {
  SPENDING = 'spending',
  VISIT = 'visit',
  HYBRID = 'hybrid',
}

@Entity('loyalty_rules')
export class LoyaltyRule extends AbstractBaseEntity {
  @ApiProperty()
  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ApiProperty({ required: false })
  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @ApiProperty({ enum: RuleType, default: RuleType.HYBRID })
  @Column({ type: 'simple-enum', enum: RuleType, default: RuleType.HYBRID })
  ruleType: RuleType;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ default: 10 })
  @Column({ default: 10 })
  spendingBaseAmount: number;

  @ApiProperty({ default: 1 })
  @Column({ default: 1 })
  spendingBasePoints: number;

  @ApiProperty({ default: 50 })
  @Column({ default: 50 })
  visitPoints: number;

  @ApiProperty({ default: 24 })
  @Column({ default: 24 })
  visitCooldownHours: number;

  @ApiProperty({ default: 100 })
  @Column({ default: 100 })
  firstVisitBonus: number;

  @ApiProperty({ default: 500 })
  @Column({ default: 500 })
  birthdayBonus: number;

  @ApiProperty({ default: 200 })
  @Column({ default: 200 })
  referralBonus: number;
}
