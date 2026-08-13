import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('fos_metrics_snapshots')
export class MetricsSnapshot extends AbstractBaseEntity {
  @Column({ type: 'date', unique: true })
  @Index()
  date: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalRevenue: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalProfit: number;

  @Column({ default: 0 })
  totalBusinesses: number;

  @Column({ default: 0 })
  activeAgents: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  churnRate: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  conversionRate: number;
}
