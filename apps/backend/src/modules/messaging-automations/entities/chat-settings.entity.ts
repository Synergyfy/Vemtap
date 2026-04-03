import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('chat_settings')
export class ChatSettings extends AbstractBaseEntity {
  @Column({ type: 'uuid', unique: true })
  branchId: string;

  @OneToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ default: false })
  offHoursEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  offHoursMessage: string;

  @Column({ type: 'varchar', default: 'Outside Business Hours' })
  offHoursSchedule: string;

  @Column({ type: 'jsonb', nullable: true })
  customSchedule: any;
}
