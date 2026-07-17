import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { SponsoredCampaign } from './sponsored-campaign.entity';
export enum CampaignTransactionStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  REFUNDED = 'Refunded',
}

@Entity('sponsored_campaign_transactions')
export class SponsoredCampaignTransaction extends AbstractBaseEntity {
  @ManyToOne(() => SponsoredCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: SponsoredCampaign;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ nullable: true })
  invoiceNo: string;

  @Column({ nullable: true })
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: CampaignTransactionStatus,
    default: CampaignTransactionStatus.PAID,
  })
  status: CampaignTransactionStatus;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;
}
