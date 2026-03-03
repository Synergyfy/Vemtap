import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('flow_trigger_configs')
export class FlowTriggerConfig extends AbstractBaseEntity {
  @Column({ unique: true })
  key: string;

  @Column()
  label: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  inactivityDays: number;
}
