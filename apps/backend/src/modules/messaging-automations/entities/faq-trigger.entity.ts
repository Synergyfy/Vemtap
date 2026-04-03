import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('faq_triggers')
export class FaqTrigger extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @Column({ type: 'text' })
  response: string;

  @Column({ default: true })
  isActive: boolean;
}
