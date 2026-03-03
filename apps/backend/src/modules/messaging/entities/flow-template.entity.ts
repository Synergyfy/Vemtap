import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('flow_templates')
export class FlowTemplate extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  triggerType: string;

  @Column({ default: 'v1' })
  version: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'jsonb', default: { nodes: [], edges: [] } })
  structure: any;
}
