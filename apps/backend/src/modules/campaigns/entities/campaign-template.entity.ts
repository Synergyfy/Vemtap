import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

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
    description: 'Branch ID (null for global templates)',
    required: false,
  })
  @Column({ nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;
}
