import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { FosLedgerSource } from './invoice.entity';

export enum FosBillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

@Entity('fos_bills')
export class FosBill extends AbstractBaseEntity {
  @Column()
  description: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: 'date' })
  @Index()
  dueDate: string;

  @Column({ type: 'enum', enum: FosBillStatus, default: FosBillStatus.PENDING })
  status: FosBillStatus;

  @Column({ nullable: true })
  category: string;

  @Column({
    type: 'enum',
    enum: FosLedgerSource,
    default: FosLedgerSource.MANUAL,
  })
  source: FosLedgerSource;

  @Column({ type: 'date', nullable: true })
  paidAt: string;
}
