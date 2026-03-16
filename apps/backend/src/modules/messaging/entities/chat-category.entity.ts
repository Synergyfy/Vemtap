import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('chat_categories')
export class ChatCategory extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  routeTo: string;

  @Column({ type: 'enum', enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  urgency: 'Low' | 'Medium' | 'High';

  @Column({ type: 'jsonb', default: [] })
  teamAccess: string[];

  @Column({ nullable: true })
  icon: string;
}
