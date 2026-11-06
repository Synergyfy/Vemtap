import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
export enum SponsoredCampaignStatus {
  /** Being built by the business; nothing reserved yet. */
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  ENDED = 'Ended',
  PENDING = 'Pending',
  PAUSED = 'Paused',
}

export enum SponsoredCampaignKind {
  /** One asset pushed to nearby customers (Boost wizard). */
  BOOST = 'boost',
  /** Multi-asset campaign with targeting and schedule (Campaign wizard). */
  PROMOTION = 'promotion',
}

export interface SponsoredCampaignAsset {
  type: 'deal' | 'product' | 'service' | 'profile';
  id: string;
}

export interface SponsoredCampaignAudience {
  /** Boost: nearby | districts | clusters. Promotion: nearby | segments. */
  strategy?: string;
  scope?: string;
  segmentIds?: string[];
  cohorts?: string[];
  branchIds?: string[];
  /**
   * Districts (boost scope `districts`, campaigns) or the business's own
   * clusters (boost scope `clusters`). When set, the deal is served only to
   * viewers inside one of them, instead of within `radiusKm` of the branch.
   */
  clusterIds?: string[];
  radiusKm?: number;
  /** Boosts only: `regulars` | `walkins` (`BOOST_AUDIENCE_TYPES`). */
  audienceType?: string;
}

export interface SponsoredCampaignSchedule {
  durationDays: number;
  instantLaunch?: boolean;
  startAt?: string | null;
  dayparting?: boolean;
  /** Daypart ids, e.g. lunch | dinner | late. */
  windows?: string[];
  /** 0 = Sunday … 6 = Saturday. */
  weekdays?: number[];
  autoRenew?: boolean;
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

  @Column({
    type: 'varchar',
    length: 20,
    default: SponsoredCampaignKind.PROMOTION,
  })
  kind: SponsoredCampaignKind;

  /** Promotion objective (customers | deal | visibility | products | orders | visits). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  objective: string | null;

  /** Boost goal (claims | views | profile | footfall). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  goalId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  assets: SponsoredCampaignAsset[] | null;

  @Column({ type: 'jsonb', nullable: true })
  audience: SponsoredCampaignAudience | null;

  @Column({ type: 'text', array: true, nullable: true })
  placements: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  schedule: SponsoredCampaignSchedule | null;

  @Column({ type: 'varchar', length: 10, default: 'total' })
  budgetMode: 'total' | 'daily';

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value == null ? null : parseFloat(value),
    },
  })
  dailyBudget: number | null;

  @Column({ type: 'varchar', length: 10, default: 'wallet' })
  fundingSource: 'wallet' | 'card';

  /** Pending card top-up that will fund this campaign's launch. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  paymentReference: string | null;

  @Column({ type: 'timestamp', nullable: true })
  launchedAt: Date | null;

  /** Set while paused; resume shifts the schedule by the time spent paused. */
  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  /** The campaign this one was auto-renewed from. */
  @Column({ type: 'uuid', nullable: true })
  renewedFromId: string | null;
}
