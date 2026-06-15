import { Entity, Column, ManyToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { MarketingTemplate } from './marketing-template.entity';

@Entity('marketing_categories')
export class MarketingCategory extends AbstractBaseEntity {
  @ApiProperty({ example: 'Restaurant', description: 'Display name of the category' })
  @Column()
  name: string;

  @ApiProperty({ example: 'restaurant', description: 'URL-friendly slug' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'Templates suited for restaurants and cafes', nullable: true })
  @Column({ nullable: true })
  description?: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug) {
      this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  }

  @ApiProperty({ example: 'UtensilsCrossed', nullable: true })
  @Column({ nullable: true })
  icon?: string;

  @ApiProperty({ example: '#2563EB', nullable: true })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => MarketingTemplate, template => template.categories)
  templates?: MarketingTemplate[];
}
