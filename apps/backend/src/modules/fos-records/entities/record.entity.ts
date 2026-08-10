import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum FosRecordType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

@Entity('fos_records')
export class FosRecord extends AbstractBaseEntity {
  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'enum', enum: FosRecordType })
  type: FosRecordType;

  @Column()
  category: string;

  @Column()
  description: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  amount: number;
}
