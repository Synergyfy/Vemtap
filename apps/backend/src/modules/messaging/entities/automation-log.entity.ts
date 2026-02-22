import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { AutomationRule } from './automation-rule.entity';

@Entity('automation_logs')
export class AutomationLog extends AbstractBaseEntity {
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

  @ManyToOne(() => AutomationRule, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ruleId' })
  rule: AutomationRule;

  @Column({ nullable: true })
  ruleId: string;

  @ManyToOne(() => Contact, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({ nullable: true })
  contactId: string;

  @Column({ type: 'simple-json', nullable: true })
  triggerPayload: any;

  @Column({ default: 'executed' })
  status: string; // executed, failed, delayed

  @Column({ nullable: true })
  messageId: string; // Linked message ID if sent

  @Column({ nullable: true })
  errorReason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executedAt: Date;
}
