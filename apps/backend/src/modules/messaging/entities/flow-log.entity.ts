import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { FlowExecution } from './flow-execution.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('flow_logs')
export class FlowLog extends AbstractBaseEntity {
  @ManyToOne(() => FlowExecution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flowSessionId' })
  flowExecution: FlowExecution;

  @Column()
  flowSessionId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;

  @Column()
  actionType: string;

  @Column({ default: false })
  isError: boolean;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;
}
