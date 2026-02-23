import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FlowExecution } from './flow-execution.entity';

export enum FlowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
}

export enum FlowTriggerType {
  NEW_VISITOR = 'new_visitor',
  MANUAL = 'manual',
  TAG_APPLIED = 'tag_applied',
  BIRTHDAY = 'birthday',
  LOYALTY_MILESTONE = 'loyalty_milestone',
}

@Entity('flows')
export class Flow extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: FlowStatus, default: FlowStatus.DRAFT })
  status: FlowStatus;

  @Column({ type: 'enum', enum: FlowTriggerType })
  triggerType: FlowTriggerType;

  // JSON structure for nodes and edges
  @Column({ type: 'jsonb', default: { nodes: [], edges: [] } })
  structure: any;

  @OneToMany(() => FlowExecution, (execution) => execution.flow)
  executions: FlowExecution[];
}
