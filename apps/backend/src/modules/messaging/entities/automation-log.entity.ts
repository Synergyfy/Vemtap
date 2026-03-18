import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AutomationRule } from './automation-rule.entity';

@Entity('automation_logs')
export class AutomationLog extends AbstractBaseEntity {
  @ManyToOne(() => AutomationRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruleId' })
  rule: AutomationRule;

  @Column()
  ruleId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  errorReason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executedAt: Date;
}
