import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('marketing_brand_overrides')
export class MarketingBrandOverride extends AbstractBaseEntity {
  @OneToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid' })
  @Column({ unique: true })
  businessId: string;

  @ApiProperty({ example: 'https://cdn.vemtap.com/brands/override-logo.png', nullable: true })
  @Column({ nullable: true })
  logoUrl: string;

  @ApiProperty({ example: '#2563EB', nullable: true })
  @Column({ nullable: true })
  primaryColor: string;

  @ApiProperty({ example: '#1E293B', nullable: true })
  @Column({ nullable: true })
  secondaryColor: string;

  @ApiProperty({ example: '#F59E0B', nullable: true })
  @Column({ nullable: true })
  accentColor: string;

  @ApiProperty({ example: 'Best Coffee in Town!', nullable: true })
  @Column({ nullable: true })
  tagline: string;

  @ApiProperty({ example: 'Inter', nullable: true })
  @Column({ nullable: true })
  fontFamily: string;

  @ApiProperty({ example: 'https://example.com', nullable: true })
  @Column({ nullable: true })
  website?: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({ example: 'contact@example.com', nullable: true })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({ description: 'Social media links (jsonb)', nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: any;
}
