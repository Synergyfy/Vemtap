import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  pointCost: number;

  @Column({ default: 'discount' }) // discount, free_item, etc.
  rewardType: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'int', default: 30 })
  validityDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  usageLimitPerUser: number;

  @Column({ type: 'int', default: 0 })
  totalRedeemed: number;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
