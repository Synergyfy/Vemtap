import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('marketing_brand_rules')
export class MarketingBrandRule extends AbstractBaseEntity {
  @OneToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid' })
  @Column({ unique: true })
  businessId: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  logoRequired: boolean;

  @ApiProperty({ example: true })
  @Column({ default: true })
  primaryColorRequired: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  secondaryColorRequired: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  fontFamilyRequired: boolean;

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
