import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('rewards')
export class Reward extends AbstractBaseEntity {
  @ApiProperty({ description: 'Business ID' })
  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ description: 'Branch ID', example: 'branch_001' })
  @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ description: 'Reward name', example: 'Free Coffee' })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Reward description',
    example: 'Get a free coffee on us',
  })
  @Column('text', { nullable: true })
  description: string;

  @ApiProperty({ description: 'Reward type', example: 'free_item' })
  @Column({ default: 'free_item' })
  rewardType: string;

  @ApiProperty({ description: 'Point cost to redeem', example: 500 })
  @Column({ type: 'int' })
  pointCost: number;

  @ApiProperty({ description: 'Value amount', example: 5.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @ApiProperty({
    description: 'Days until it expires after redemption',
    example: 30,
  })
  @Column({ type: 'int', default: 30 })
  validityDays: number;

  @ApiProperty({ description: 'Usage limit per user', example: 1 })
  @Column({ type: 'int', default: 1 })
  usageLimitPerUser: number;

  @ApiProperty({ description: 'Total redemptions', example: 0 })
  @Column({ type: 'int', default: 0 })
  totalRedeemed: number;

  @ApiProperty({ description: 'Is active', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Image URL' })
  @Column({ nullable: true })
  imageUrl: string;
}

