import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export enum ReportStatus {
  READY = 'Ready',
  PROCESSING = 'Processing',
  FAILED = 'Failed',
}

@Entity('discovery_reports')
export class Report extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  dateRange: string;

  @Column({
    type: 'simple-enum',
    enum: ReportStatus,
    default: ReportStatus.PROCESSING,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  fileSize: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'generatedById' })
  generatedBy: User;

  @Column({ type: 'uuid', nullable: true })
  generatedById: string;
}
