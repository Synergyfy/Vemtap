import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Coupon } from './coupon.entity';
import { PromotionCode } from './promotion-code.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import {
  Subscription,
  BillingPeriod,
} from '../../subscriptions/entities/subscription.entity';

@Entity('coupon_redemptions')
@Index(['promotionCodeId', 'businessId'])
@Index(['couponId'])
@Index(['businessId'])
@Index(['paymentReference'], { unique: true })
export class CouponRedemption extends AbstractBaseEntity {
  @ManyToOne(() => Coupon, (coupon) => coupon.redemptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column()
  couponId: string;

  @ManyToOne(() => PromotionCode, (promo) => promo.redemptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'promotionCodeId' })
  promotionCode: PromotionCode;

  @Column()
  promotionCodeId: string;

  @ManyToOne(() => Business, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business | null;

  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Subscription, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription | null;

  @Column({ nullable: true })
  subscriptionId: string | null;

  @Column({ unique: true })
  paymentReference: string;

  @Column()
  planId: string;

  @Column({ type: 'simple-enum', enum: BillingPeriod })
  billingPeriod: BillingPeriod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ default: 'NGN' })
  currency: string;
}
