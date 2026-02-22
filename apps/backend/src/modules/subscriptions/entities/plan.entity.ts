import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quarterlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ default: false })
  isFree: boolean;

  @Column({ nullable: true })
  freeDurationDays: number; // null implies free forever

  // Feature Limits (-1 or null will imply unlimited natively but let's just stick to -1 as unlimited or use nullable)
  @Column({ type: 'int', nullable: true })
  teamMembersLimit: number | null;

  @Column({ type: 'int', nullable: true })
  loyaltyLimit: number | null;

  @Column({ type: 'int', nullable: true })
  tagsLimit: number | null;

  @Column({ type: 'int', default: 1 })
  branchLimit: number;

  @Column({ default: 'basic' })
  analyticsLevel: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isPopular: boolean;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Subscription[];
}
