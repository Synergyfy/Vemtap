import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('feedback')
export class Feedback extends AbstractBaseEntity {
  @Column({ nullable: true })
  businessId: string;

  @Column({ nullable: true })
  branchId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column('int', { default: 5 })
  rating: number;

  @Column('text')
  comment: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ default: 'positive' })
  sentiment: string;
}
