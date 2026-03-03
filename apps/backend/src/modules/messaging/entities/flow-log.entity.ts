import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { FlowExecution } from './flow-execution.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('flow_logs')
export class FlowLog extends AbstractBaseEntity {
  @ManyToOne(() => FlowExecution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flowSessionId' })
  flowExecution: FlowExecution;

  @Column()
  flowSessionId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column()
  actionType: string;

  @Column({ default: false })
  isError: boolean;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;
}
