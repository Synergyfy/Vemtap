import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('support_knowledge')
export class SupportKnowledge extends AbstractBaseEntity {
  @ApiProperty({ example: 'How to top up credits' })
  @Column()
  question: string;

  @ApiProperty({ example: 'You can top up credits by going to Settings > Billing.' })
  @Column('text')
  answer: string;

  @ApiProperty({ example: ['credits', 'topup', 'balance'] })
  @Column('jsonb', { default: [] })
  @Index({ fulltext: true })
  keywords: string[];

  @ApiProperty({ example: 'billing' })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  useCount: number;

  @ApiProperty({ example: '/dashboard/settings/billing' })
  @Column({ nullable: true })
  link: string;
}

@Entity('bot_interactions')
export class BotInteraction extends AbstractBaseEntity {
  @Column()
  userId: string;

  @Column()
  query: string;

  @Column('text')
  response: string;

  @Column({ enum: ['rule', 'ai', 'fallback'], default: 'rule' })
  source: string;

  @Column({ nullable: true })
  knowledgeId: string;

  @Column({ default: false })
  wasHelpful: boolean;
}
