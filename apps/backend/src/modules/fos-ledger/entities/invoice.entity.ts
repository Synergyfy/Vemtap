import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum FosInvoiceStatus {
  OVERDUE = 'OVERDUE',
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum FosLedgerSource {
  MANUAL = 'manual',
  SYSTEM = 'system',
}

@Entity('fos_invoices')
export class FosInvoice extends AbstractBaseEntity {
  @Column()
  @Index()
  customer: string;

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

  @Column({
    type: 'enum',
    enum: FosInvoiceStatus,
    default: FosInvoiceStatus.PENDING,
  })
  status: FosInvoiceStatus;

  @Column({
    type: 'enum',
    enum: FosLedgerSource,
    default: FosLedgerSource.MANUAL,
  })
  source: FosLedgerSource;

  @Column({ type: 'date', nullable: true })
  collectedAt: string;
}
