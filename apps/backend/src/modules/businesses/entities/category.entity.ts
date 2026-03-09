import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Subcategory } from './subcategory.entity';

@Entity('categories')
export class Category extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category)
  subcategories: Subcategory[];
}
