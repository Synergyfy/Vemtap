import { Entity, Column, Index, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum FosCommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
}

@Entity('fos_agent_commissions')
@Unique(['agentId', 'period'])
export class FosAgentCommission extends AbstractBaseEntity {
  @Column()
  @Index()
  agentId: string;

  @Column({
    type: 'enum',
    enum: FosCommissionStatus,
    default: FosCommissionStatus.PENDING,
  })
  status: FosCommissionStatus;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  commissionEarned: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  revenueAttributed: number;

  @Column({ nullable: true })
  @Index()
  period: string;
}
