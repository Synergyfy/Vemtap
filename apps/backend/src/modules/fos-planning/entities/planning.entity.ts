import { Entity, Column, Index, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('fos_budget_items')
export class FosBudgetItem extends AbstractBaseEntity {
  @Column()
  @Index()
  category: string;

  @Column()
  item: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  planned: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  actual: number;

  @Column({ nullable: true })
  notes: string;
}

@Entity('fos_budget_categories')
@Unique(['name'])
export class FosBudgetCategory extends AbstractBaseEntity {
  @Column()
  @Index()
  name: string;
}

@Entity('fos_forecast_aspects')
export class FosForecastAspect extends AbstractBaseEntity {
  @Column()
  label: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  baseValue: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  growthRate: number;
}
