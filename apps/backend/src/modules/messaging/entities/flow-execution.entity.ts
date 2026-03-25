import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Flow } from './flow.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING = 'waiting', // Waiting for user reply or delay
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('flow_executions')
export class FlowExecution extends AbstractBaseEntity {
  @ManyToOne(() => Flow, (flow) => flow.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flowId' })
  flow: Flow;

  @Column()
  flowId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @Column({ nullable: true })
  currentNodeId: string; // The ID of the node currently being processed or waiting at

  @Column({ type: 'jsonb', default: {} })
  state: any; // Stores context, variable values, etc.

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ nullable: true })
  lastMessageId: string; // ID of the last message sent (for reply matching)

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date; // For delays
}
