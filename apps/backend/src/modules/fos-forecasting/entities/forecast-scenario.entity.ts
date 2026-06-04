import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('fos_forecast_scenarios')
export class ForecastScenario extends AbstractBaseEntity {
  @Column()
  scenarioName: string;

  @Column({ type: 'jsonb' })
  parameters: {
    growthRate: number;
    churnRate: number;
    conversionRate: number;
    period: number;
  };

  @Column({ type: 'jsonb' })
  result: Record<string, unknown>;
}
