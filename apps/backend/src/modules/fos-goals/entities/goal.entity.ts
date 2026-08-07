import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('fos_goals')
export class Goal extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  target: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  current: number;

  @Column({ type: 'date', nullable: true })
  deadline: string;

  @Column({ nullable: true })
  category: string;
}

@Entity('fos_projects')
export class Project extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  budget: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  spent: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  revenue: number;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'date', nullable: true })
  deadline: string;
}
