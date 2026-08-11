import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('fos_transfers')
export class FosTransfer extends AbstractBaseEntity {
  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ default: 'Transfer' })
  type: string;

  @Column({ nullable: true })
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

  @Column({ nullable: true })
  @Index()
  reference: string;
}
