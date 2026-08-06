import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_template_styles')
export class MarketingTemplateStyle extends AbstractBaseEntity {
  @ApiProperty({ example: 'Classic', description: 'Display name of the style' })
  @Column()
  name: string;

  @ApiProperty({ example: 'classic', description: 'URL-friendly slug' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'Simple & Professional', nullable: true })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ example: '#FFFFFF' })
  @Column({ length: 7 })
  bgColor: string;

  @ApiProperty({ example: '#1E293B' })
  @Column({ length: 7 })
  accentColor: string;

  @ApiProperty({ example: '#CBD5E1' })
  @Column({ length: 7 })
  borderColor: string;

  @ApiProperty({ example: '#0F172A' })
  @Column({ length: 7 })
  qrFgColor: string;

  @ApiProperty({ example: '#FFFFFF' })
  @Column({ length: 7 })
  qrBgColor: string;

  @ApiProperty({ example: '#0F172A' })
  @Column({ length: 7 })
  textColor: string;

  @ApiProperty({
    example: { fontFamily: 'Inter', headingSize: 32, bodySize: 14 },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  fontConfig?: Record<string, any>;

  @ApiProperty({ example: { padding: 16, gap: 8 }, nullable: true })
  @Column({ type: 'json', nullable: true })
  layoutConfig?: Record<string, any>;

  @ApiProperty({
    example: { borderRadius: 8, buttonStyle: 'filled' },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  ctaConfig?: Record<string, any>;

  @ApiProperty({
    example: { cornerStyle: 'rounded', iconStyle: 'default' },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  qrConfig?: Record<string, any>;

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
