import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Plan } from './plan.entity';

export enum BillingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

@Entity('subscriptions')
@Index('idx_subscriptions_business', ['businessId', 'status'])
export class Subscription extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column()
  planId: string;

  @Column({ type: 'simple-enum', enum: BillingPeriod })
  billingPeriod: BillingPeriod;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndDate: Date | null;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // Track the paystack payment ref
  @Column({ nullable: true })
  paystackReference: string;

  // Store authorization code for recurring charges
  @Column({ type: 'text', nullable: true })
  paystackAuthorizationCode: string | null;

  // Renewal reminder bookkeeping (see SubscriptionRemindersService). Tracks the
  // last escalation stage delivered so a business isn't reminded daily about
  // the same expiring subscription.
  @Column({ type: 'timestamp', nullable: true })
  lastRenewalReminderAt: Date | null;

  @Column({ type: 'int', nullable: true })
  lastRenewalReminderStage: number | null;
}
