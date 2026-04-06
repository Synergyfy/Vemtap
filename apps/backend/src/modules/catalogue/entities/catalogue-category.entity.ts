import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { CatalogueItem } from './catalogue-item.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('catalogue_categories')
export class CatalogueCategory extends AbstractBaseEntity {
  @ApiProperty({ example: 'Food' })
  @Column()
  name: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @OneToMany(() => CatalogueItem, (item: CatalogueItem) => item.category)
  items: CatalogueItem[];
}
