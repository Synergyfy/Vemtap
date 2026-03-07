import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

@Entity('message_templates')
@Unique(['branchId', 'name', 'channel'])
export class MessageTemplate extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @Column()
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.PENDING,
  })
  status: TemplateStatus;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.MARKETING,
  })
  category: TemplateCategory;

  @Column({ default: 'English (US)' })
  language: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string | null;
}
