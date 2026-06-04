import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('fos_metrics_snapshots')
export class MetricsSnapshot extends AbstractBaseEntity {
  @Column({ type: 'date', unique: true })
  @Index()
  date: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalProfit: number;

  @Column({ default: 0 })
  totalBusinesses: number;

  @Column({ default: 0 })
  activeAgents: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  churnRate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conversionRate: number;
}
