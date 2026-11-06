import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import type { StoreOrderingSettings } from '../dto/store-ordering.dto';

/** One row per business: its store-ordering settings document. */
@Entity('store_ordering_settings')
export class StoreOrderingSetting extends AbstractBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'jsonb' })
  settings: StoreOrderingSettings;
}
