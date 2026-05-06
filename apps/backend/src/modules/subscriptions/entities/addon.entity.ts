import { Entity, Column, OneToMany, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { BusinessAddOn } from './business-addon.entity';

export enum AddOnType {
  RESOURCE = 'RESOURCE',
  SERVICE = 'SERVICE',
}

export interface ServiceDetails {
  agentType: 'dashboard_manager' | 'expert' | 'support_agent';
  description: string;
  deliverables: string[];
}

@Entity('addons')
export class AddOn extends AbstractBaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('IDX_addons_type')
  @Column({ type: 'enum', enum: AddOnType })
  type: AddOnType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 30 })
  durationDays: number;

  @Column({ type: 'varchar', default: 'NGN' })
  currency: string;

  @Index('IDX_addons_isActive')
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  targetCapability: string | null;

  @Column({ type: 'int', nullable: true })
  additionalLimit: number | null;

  @Column({ type: 'jsonb', nullable: true })
  serviceDetails: ServiceDetails | null;

  @Column({ type: 'boolean', default: false })
  isOneTime: boolean;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @OneToMany(() => BusinessAddOn, (ba) => ba.addon)
  businessAddOns: BusinessAddOn[];
}