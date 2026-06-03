import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { MarketingCategory } from './marketing-category.entity';

@Entity('marketing_templates')
export class MarketingTemplate extends AbstractBaseEntity {
  @ApiProperty({ example: 'Sleek Table Tent', description: 'Name of the template' })
  @Column()
  name: string;

  @ApiProperty({ example: 'A modern design perfect for cafes and restaurants', description: 'Description of the template' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: 'Restaurant', description: 'Business category the template is suited for' })
  @Column()
  category: string;

  @ApiProperty({ example: ['uuid'], description: 'FKs to marketing_categories' })
  @ManyToMany(() => MarketingCategory, cat => cat.templates)
  @JoinTable({ name: 'marketing_template_categories' })
  categories?: MarketingCategory[];

  @ApiProperty({ example: 'table_tent', description: 'Type of the template (table_tent, poster, flyer, business_card)' })
  @Column()
  type: string;

  @ApiProperty({ description: 'Full HTML/CSS canvas layout structure and design system configurations' })
  @Column({ type: 'jsonb' })
  layoutConfig: any;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 'https://cdn.vemtap.com/templates/table-tent-sleek.png', nullable: true })
  @Column({ nullable: true })
  thumbnailUrl: string;

  @ApiProperty({ description: 'QR Code styling defaults (colors, margin, dots, corners)' })
  @Column({ type: 'jsonb', nullable: true })
  qrCodeConfig: any;
}
