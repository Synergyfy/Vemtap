import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_template_formats')
export class MarketingTemplateFormat extends AbstractBaseEntity {
  @ApiProperty({
    example: 'A4 Poster',
    description: 'Display name of the format',
  })
  @Column()
  name: string;

  @ApiProperty({ example: 'poster_a4', description: 'URL-friendly slug' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 210, description: 'Width in millimetres' })
  @Column({ type: 'float' })
  widthMm: number;

  @ApiProperty({ example: 297, description: 'Height in millimetres' })
  @Column({ type: 'float' })
  heightMm: number;

  @ApiProperty({
    example: 3,
    description: 'Bleed area in millimetres',
    default: 3,
  })
  @Column({ type: 'float', default: 3 })
  bleedMm: number;

  @ApiProperty({
    example: 5,
    description: 'Print margin in millimetres',
    default: 5,
  })
  @Column({ type: 'float', default: 5 })
  printMarginMm: number;

  @ApiProperty({ example: 300, description: 'Resolution in DPI', default: 300 })
  @Column({ type: 'int', default: 300 })
  resolution: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }
}
