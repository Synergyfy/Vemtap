import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { TriggerType, ActionType } from '../enums/automation.enum';

@Entity('automation_rules')
export class AutomationRule extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TriggerType,
  })
  triggerType: TriggerType;

  @Column({ nullable: true, default: 0 })
  delaySeconds: number; // 0 means immediate

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ type: 'jsonb', default: {} })
  actionConfig: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;
}
