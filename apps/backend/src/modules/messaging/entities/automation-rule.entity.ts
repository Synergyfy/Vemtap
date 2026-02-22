import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';
import { MessageTemplate } from './message-template.entity';

export enum AutomationTriggerType {
  VISITOR_CAPTURED = 'visitor_captured',
  SURVEY_COMPLETED = 'survey_completed',
  ABANDONED_SESSION = 'abandoned_session',
  MANUAL = 'manual',
}

@Entity('automation_rules')
export class AutomationRule extends AbstractBaseEntity {
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

  @Column({ type: 'enum', enum: AutomationTriggerType })
  triggerType: AutomationTriggerType;

  @Column({ type: 'simple-json', nullable: true })
  conditions: any; // e.g., { surveyId: '123' } or { minPoints: 50 }

  @Column({ type: 'enum', enum: Channel })
  actionChannel: Channel;

  @ManyToOne(() => MessageTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actionTemplateId' })
  template: MessageTemplate;

  @Column({ nullable: true })
  actionTemplateId: string;

  @Column({ type: 'int', default: 0 })
  delaySeconds: number; // 0 for immediate

  @Column({ default: true })
  isActive: boolean;
}
