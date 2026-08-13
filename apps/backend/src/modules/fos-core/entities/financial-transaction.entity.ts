import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum FosTransactionType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  SMS = 'SMS',
  COMMISSION = 'COMMISSION',
  EXPENSE = 'EXPENSE',
  REFUND = 'REFUND',
  POS_SALE = 'POS_SALE',
  POS_REFUND = 'POS_REFUND',
}

export enum FosPlatform {
  VEMTAP = 'VEMTAP',
  QRTHRIVE = 'QRTHRIVE',
}

@Entity('fos_transactions')
export class FinancialTransaction extends AbstractBaseEntity {
  @Column({ type: 'enum', enum: FosTransactionType })
  @Index()
  type: FosTransactionType;

  @Column({ type: 'enum', enum: FosPlatform })
  @Index()
  platform: FosPlatform;

  @Column({ nullable: true })
  @Index()
  businessId: string;

  @Column({ nullable: true })
  @Index()
  agentId: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  cost: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  profit: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  @Index()
  referenceId: string;

  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ nullable: true })
  description: string;
}
