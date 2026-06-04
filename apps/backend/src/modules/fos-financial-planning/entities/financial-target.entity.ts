import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum TargetPeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('fos_financial_targets')
export class FinancialTarget extends AbstractBaseEntity {
  @Column({ type: 'enum', enum: TargetPeriodType })
  periodType: TargetPeriodType;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  targetRevenue: number;

  @Column({ default: 0 })
  targetBusinesses: number;

  @Column({ default: 0 })
  targetSmsUsage: number;

  @Column({ default: 0 })
  targetEmailUsage: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  profitMargin: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;
}
