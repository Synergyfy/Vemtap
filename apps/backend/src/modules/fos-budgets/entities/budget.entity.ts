import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum BudgetPeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity('fos_budgets')
export class Budget extends AbstractBaseEntity {
  @Column({ type: 'enum', enum: BudgetPeriodType })
  @Index()
  periodType: BudgetPeriodType;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  targetRevenue: number;

  @Column({ default: 0 })
  targetBusinesses: number;

  @Column({ default: 0 })
  targetSmsUsage: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  targetProfit: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;
}
