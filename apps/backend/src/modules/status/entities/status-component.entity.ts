import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum SystemComponentStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  OUTAGE = 'outage',
}

@Entity('system_components')
export class SystemComponent extends AbstractBaseEntity {
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: SystemComponentStatus,
    default: SystemComponentStatus.OPERATIONAL,
  })
  status: SystemComponentStatus;

  @Column({ type: 'int', nullable: true })
  latencyMs: number | null;

  @Column({ default: '99.98%' })
  uptime90d: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}
