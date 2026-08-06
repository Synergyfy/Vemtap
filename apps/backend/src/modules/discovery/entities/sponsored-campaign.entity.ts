import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
export enum SponsoredCampaignStatus {
  ACTIVE = 'Active',
  ENDED = 'Ended',
  PENDING = 'Pending',
  PAUSED = 'Paused',
}

@Entity('sponsored_campaigns')
export class SponsoredCampaign extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  radius: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spent: number;

  @Column({ nullable: true })
  duration: string;

  @Column({
    type: 'simple-enum',
    enum: SponsoredCampaignStatus,
    default: SponsoredCampaignStatus.PENDING,
  })
  status: SponsoredCampaignStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;
}
