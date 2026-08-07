import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum ExpenseFrequency {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

@Entity('expenses')
export class Expense extends AbstractBaseEntity {
  @Column()
  category: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: 'enum', enum: ExpenseFrequency })
  frequency: ExpenseFrequency;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;
}
