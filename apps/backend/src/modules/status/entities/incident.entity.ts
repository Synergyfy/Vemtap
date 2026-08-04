import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum IncidentSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  INVESTIGATING = 'investigating',
  IDENTIFIED = 'identified',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved',
}

@Entity('incidents')
export class Incident extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  componentSlug: string;

  @Column({
    type: 'simple-enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MINOR,
  })
  severity: IncidentSeverity;

  @Column({
    type: 'simple-enum',
    enum: IncidentStatus,
    default: IncidentStatus.INVESTIGATING,
  })
  status: IncidentStatus;

  @Index()
  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
