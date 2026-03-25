import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { RewardTemplate, RewardCategory } from './reward-template.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RewardAudienceType {
  NEW = 'new',
  RETURNING = 'returning',
  ALL = 'all',
}


@Entity('rewards')
export class Reward extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty()
  @Column()
  pointsRequired: number;

  @ApiProperty({ enum: RewardCategory })
  @Column({ type: 'simple-enum', enum: RewardCategory })
  category: RewardCategory;

  @ApiProperty({ enum: RewardAudienceType, default: RewardAudienceType.ALL })
  @Column({ type: 'simple-enum', enum: RewardAudienceType, default: RewardAudienceType.ALL })
  audienceType: RewardAudienceType;

  @ApiProperty()
  @Column({ nullable: true })
  coverImage: string;

  @ApiProperty()
  @Column({ type: 'simple-array', nullable: true })
  galleryImages: string[];

  @ApiProperty()
  @Column()
  totalQuantity: number;

  @ApiProperty()
  @Column()
  remainingQuantity: number;

  @ApiProperty()
  @Column({ default: 0 })
  redemptionCount: number;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  expiryDate: Date;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;

  @ManyToOne(() => RewardTemplate, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: RewardTemplate;

  @Column({ nullable: true })
  templateId: string;
}
