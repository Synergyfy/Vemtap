import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('campaign_templates')
export class CampaignTemplate extends AbstractBaseEntity {
  @ApiProperty({ example: 'Welcome Message', description: 'Template title' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'Onboarding',
    description: 'Category (e.g., Marketing, Retention)',
  })
  @Column()
  category: string;

  @ApiProperty({ example: 'WhatsApp', description: 'Channel type or "Any"' })
  @Column()
  type: string;

  @ApiProperty({
    example: 'Hello {name}, welcome to our store!',
    description: 'Template content with variables',
  })
  @Column('text')
  content: string;

  @ApiProperty({
    example: 'blue',
    description: 'Color code for UI display',
    required: false,
  })
  @Column({ nullable: true })
  textColor: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Business ID',
    required: false,
  })
  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
