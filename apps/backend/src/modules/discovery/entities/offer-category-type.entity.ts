import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
export enum CategoryTypeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('offer_category_types')
export class OfferCategoryType extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: CategoryTypeStatus,
    default: CategoryTypeStatus.ACTIVE,
  })
  status: CategoryTypeStatus;

  @Column({ type: 'int', default: 0 })
  offerCount: number;
}
