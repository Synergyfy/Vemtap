import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PromotionCode } from './promotion-code.entity';
import { CouponRedemption } from './coupon-redemption.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponDuration {
  ONCE = 'ONCE',
  REPEATING = 'REPEATING',
  FOREVER = 'FOREVER',
}

@Entity('coupons')
export class Coupon extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minSubtotal: number | null;

  @Column({
    type: 'simple-enum',
    enum: CouponDuration,
    default: CouponDuration.ONCE,
  })
  duration: CouponDuration;

  @Column({ type: 'int', nullable: true })
  durationInMonths: number | null;

  @Column('text', { array: true, default: [] })
  applicablePlanIds: string[];

  @Column('text', { array: true, default: [] })
  applicableBillingPeriods: string[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @Column({ nullable: true })
  createdById: string | null;

  @OneToMany(() => PromotionCode, (promo) => promo.coupon)
  promotionCodes: PromotionCode[];

  @OneToMany(() => CouponRedemption, (redemption) => redemption.coupon)
  redemptions: CouponRedemption[];
}
