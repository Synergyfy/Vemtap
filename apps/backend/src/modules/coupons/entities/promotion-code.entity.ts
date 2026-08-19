import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Coupon } from './coupon.entity';
import { User } from '../../users/entities/user.entity';
import { CouponRedemption } from './coupon-redemption.entity';

@Entity('promotion_codes')
@Index(['code'], { unique: true })
@Index(['couponId'])
export class PromotionCode extends AbstractBaseEntity {
  @ManyToOne(() => Coupon, (coupon) => coupon.promotionCodes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column()
  couponId: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxRedemptions: number | null;

  @Column({ type: 'int', default: 0 })
  timesRedeemed: number;

  @Column({ type: 'int', default: 1 })
  maxRedemptionsPerUser: number;

  @Column({ default: false })
  firstTimeOnly: boolean;

  @Column('text', { array: true, default: [] })
  allowedBusinessIds: string[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @Column({ nullable: true })
  createdById: string | null;

  @OneToMany(() => CouponRedemption, (redemption) => redemption.promotionCode)
  redemptions: CouponRedemption[];
}
