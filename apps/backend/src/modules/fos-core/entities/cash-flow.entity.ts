import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum CashFlowType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

@Entity('cash_flows')
export class CashFlow extends AbstractBaseEntity {
  @Column({ type: 'enum', enum: CashFlowType })
  type: CashFlowType;

  @Column()
  category: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;
}
