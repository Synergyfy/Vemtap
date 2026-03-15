import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum LoyaltyTemplateStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('loyalty_templates')
export class LoyaltyTemplate extends AbstractBaseEntity {
  @ApiProperty({ example: 'Cafe Welcome Boost', description: 'Template name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'Great for cafés and casual dining. Small rewards + fast visits.',
    description: 'Template description',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    enum: LoyaltyTemplateStatus,
    example: LoyaltyTemplateStatus.PUBLISHED,
    default: LoyaltyTemplateStatus.DRAFT,
  })
  @Column({
    type: 'enum',
    enum: LoyaltyTemplateStatus,
    default: LoyaltyTemplateStatus.DRAFT,
  })
  status: LoyaltyTemplateStatus;

  @ApiProperty({
    description: 'Associated loyalty rules as JSON',
    example: {
      ruleType: 'visit',
      visitPoints: 5,
      visitCooldownHours: 24,
      firstVisitBonus: 20,
    },
  })
  @Column('jsonb', { default: {} })
  rules: any;

  @ApiProperty({
    description: 'Associated rewards as JSON array',
    example: [
      {
        name: 'Free Pastry',
        rewardType: 'free_item',
        pointCost: 60,
      },
    ],
  })
  @Column('jsonb', { default: [] })
  rewards: any[];
}
