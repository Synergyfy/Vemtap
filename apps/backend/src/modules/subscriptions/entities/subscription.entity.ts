import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
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
}

@Entity('subscriptions')
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

    @Column({ type: 'simple-enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    // Track the paystack payment ref
    @Column({ nullable: true })
    paystackReference: string;
}
