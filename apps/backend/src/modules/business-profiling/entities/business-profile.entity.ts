import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ProfilePriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum ProfileStatus {
  NOT_CONTACTED = 'Not Contacted',
  CONTACTED = 'Contacted',
  INTERESTED = 'Interested',
  CLOSED = 'Closed',
}

export interface BusinessInsights {
  summary?: string;
  problems?: string[];
  recommendations: string[];
  suggestedPackage: string;
  packageReason?: string;
  qrStrategy?: string[];
  salesPitch: string;
  aiAnalysis?: string;
  pitchSummary?: string;
  aiSource?: string;
}

@Entity('business_profiles')
export class BusinessProfile extends AbstractBaseEntity {
  @ApiProperty({ example: 'Chicken Republic' })
  @Column()
  businessName: string;

  @ApiProperty({ example: 'contact@chickenrepublic.com' })
  @Column({ nullable: true })
  contactEmail: string;

  @ApiProperty({ example: '+2348000000000' })
  @Column({ nullable: true })
  contactPhone: string;

  @ApiProperty({ example: 'Wuse, Abuja' })
  @Column()
  location: string;

  @ApiProperty({ example: 'Restaurant' })
  @Column()
  businessType: string;

  @ApiProperty({ example: { doYouHaveMenu: true, footTraffic: 'high' } })
  @Column({ type: 'jsonb', default: {} })
  responses: Record<string, any>;

  @ApiProperty({ example: { hasTableService: true, highFootTraffic: true } })
  @Column({ type: 'jsonb', default: {} })
  physicalSetup: Record<string, any>;

  @ApiProperty({ example: { strategy: 'Table QR' } })
  @Column({ type: 'jsonb', default: {} })
  qrPlacement: Record<string, any>;

  @ApiProperty({ enum: ProfilePriority, example: ProfilePriority.MEDIUM })
  @Column({
    type: 'enum',
    enum: ProfilePriority,
    default: ProfilePriority.LOW,
  })
  priority: ProfilePriority;

  @ApiProperty({ enum: ProfileStatus, example: ProfileStatus.NOT_CONTACTED })
  @Column({
    type: 'enum',
    enum: ProfileStatus,
    default: ProfileStatus.NOT_CONTACTED,
  })
  status: ProfileStatus;

  @ApiProperty({ example: 15 })
  @Column({ default: 0 })
  score: number;

  @ApiProperty({ example: { recommendations: ['Use Table QR'], suggestedPackage: 'Growth', salesPitch: '...' } })
  @Column({ type: 'jsonb', default: {} })
  insights: BusinessInsights;

  @ApiProperty({ example: 'Discussed about loyalty program.' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 45 })
  @Column({ default: 0 })
  xpEarned: number;

  @ApiProperty({ example: ['Identity Complete', 'Ops Master'] })
  @Column({ type: 'jsonb', default: [] })
  achievements: string[];

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;
}
