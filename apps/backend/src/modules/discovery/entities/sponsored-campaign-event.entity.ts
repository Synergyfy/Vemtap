import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SponsoredEventType {
  IMPRESSION = 'impression',
  TAP = 'tap',
}

/**
 * A consumer seeing (impression) or opening (tap) a boosted / promoted deal.
 * Counted once per viewer, campaign, type and hour.
 */
@Entity('sponsored_campaign_events')
@Index(
  'UQ_sponsored_campaign_events_viewer_hour',
  ['campaignId', 'type', 'viewerKey', 'hourBucket'],
  {
    unique: true,
  },
)
@Index('IDX_sponsored_campaign_events_campaign_time', [
  'campaignId',
  'createdAt',
])
export class SponsoredCampaignEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid' })
  offerId: string;

  @Column({ type: 'varchar', length: 16 })
  type: SponsoredEventType;

  /** Anonymous, app-generated key (signed-out viewers count too). */
  @Column({ type: 'varchar', length: 64 })
  viewerKey: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  /** The event's hour, for the once-per-hour dedupe. */
  @Column({ type: 'timestamptz' })
  hourBucket: Date;

  @CreateDateColumn()
  createdAt: Date;
}
